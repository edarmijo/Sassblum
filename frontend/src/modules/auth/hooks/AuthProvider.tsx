/**
 * AuthProvider — separado de useAuth.tsx para que cada archivo exporte solo
 * componentes o solo hooks (react-refresh/only-export-components).
 *
 * SRP: holds the session state and exposes login/register/logout.
 * DIP: depends on IAuthService (injected, defaults to the concrete authService).
 *
 * Security (BUG-06) — NINGÚN token toca el disco:
 *   · access token  → solo en memoria, dentro de ApiClient
 *   · refresh token → cookie httpOnly emitida por el backend (JS no puede leerla)
 *   · localStorage  → solo `sb_has_session`, un booleano sin valor para un atacante
 *
 *   La pista `sb_has_session` evita disparar una rehidratación en cada visita
 *   anónima al sitio público. No es una credencial: falsificarla solo provoca un
 *   401 y se limpia sola.
 *
 *   Al montar con sesión previa, `refreshSession()` canjea la cookie por un access
 *   nuevo Y devuelve el usuario, así que tampoco hace falta guardar el perfil.
 *   Mientras dura ese canje `isBootstrapping` es true. Las rutas que dependen
 *   de sesión esperan, pero el shell y las páginas públicas siguen disponibles.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type {
  IAuthService,
  LoginCredentials,
  RegisterData,
  AuthUser,
  ProfileUpdateData,
  ChangePasswordData,
} from '../interfaces/IAuthService'
import { authService as defaultAuthService } from '../services/AuthService'
import { apiClient } from '../../../infrastructure/http/ApiClient'
import { socketClient } from '../../../infrastructure/websocket/SocketClient'
import {
  requestNotificationsRevalidation,
  resetNotificationsCache,
} from '../../notifications/hooks/useNotifications'
import { AuthContext } from './useAuth'

/** Pista no sensible: "hubo una sesión aquí". Evita rehidratar en visitas anónimas. */
const SESSION_HINT_KEY = 'sb_has_session'
/** Claves heredadas — se purgan al arrancar: guardaban tokens en disco (BUG-06). */
const LEGACY_KEYS = ['auth_tokens', 'auth_session', 'auth_user']
const SESSION_HINT_TTL_MS = 8 * 24 * 60 * 60 * 1_000
const SESSION_REFRESH_AFTER_HIDDEN_MS = 60_000
const ACCESS_TOKEN_EXPIRY_SKEW_MS = 30_000

function jwtExpiresAt(accessToken: string): number {
  try {
    const encoded = accessToken.split('.')[1]
    if (!encoded) return 0
    const normalized = encoded.replaceAll('-', '+').replaceAll('_', '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload: unknown = JSON.parse(atob(padded))
    if (typeof payload !== 'object' || payload === null) return 0
    const expiresAt = (payload as Record<string, unknown>).exp
    return typeof expiresAt === 'number' ? expiresAt * 1_000 : 0
  } catch {
    return 0
  }
}

function hasSessionHint(): boolean {
  try {
    const storedHint = localStorage.getItem(SESSION_HINT_KEY)
    if (storedHint === null) return false

    // Compatibilidad con la pista booleana de versiones anteriores. Tras una
    // restauración correcta se reemplaza por una marca temporal con caducidad.
    if (storedHint === '1') return true

    const createdAt = Number(storedHint)
    const age = Date.now() - createdAt
    const isCurrent = Number.isFinite(createdAt) && createdAt > 0 && age >= 0 && age <= SESSION_HINT_TTL_MS
    if (isCurrent) return true

    localStorage.removeItem(SESSION_HINT_KEY)
    return false
  } catch {
    return false
  }
}

function setSessionHint(): void {
  try {
    localStorage.setItem(SESSION_HINT_KEY, String(Date.now()))
  } catch {
    /* modo privado sin storage: la sesión sigue viva, solo no sobrevive recargas */
  }
}

function clearSessionHint(): void {
  try {
    localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    /* nada que limpiar */
  }
}

interface AuthProviderProps {
  children: ReactNode
  service?: IAuthService
}

export function AuthProvider({ children, service = defaultAuthService }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(hasSessionHint)
  const isResumingSession = useRef(false)
  const hiddenAtRef = useRef<number | null>(null)
  const sessionGenerationRef = useRef(0)
  const accessTokenExpiresAtRef = useRef(0)
  const bootstrapAttemptRef = useRef<{
    service: IAuthService
    promise: ReturnType<IAuthService['refreshSession']>
  } | null>(null)

  const clearLocalSession = useCallback(() => {
    sessionGenerationRef.current++
    apiClient.setAccessToken(null)
    accessTokenExpiresAtRef.current = 0
    resetNotificationsCache()
    socketClient.disconnect()
    clearSessionHint()
    setUser(null)
  }, [])

  // Rehidratación: la cookie httpOnly se canjea por access + usuario.
  useEffect(() => {
    // Purga tokens dejados en disco por versiones anteriores (BUG-06).
    for (const key of LEGACY_KEYS) {
      try {
        localStorage.removeItem(key)
      } catch {
        /* ignorar */
      }
    }

    if (!hasSessionHint()) return

    if (bootstrapAttemptRef.current?.service !== service) {
      bootstrapAttemptRef.current = { service, promise: service.refreshSession() }
    }

    const bootstrapAttempt = bootstrapAttemptRef.current.promise
    let cancelled = false
    void (async () => {
      try {
        const { user: u, tokens } = await bootstrapAttempt
        if (cancelled) return
        apiClient.setAccessToken(tokens.accessToken)
        accessTokenExpiresAtRef.current = jwtExpiresAt(tokens.accessToken)
        socketClient.connect(tokens.accessToken)
        setSessionHint()
        setUser(u)
      } catch {
        // Cookie ausente, vencida o revocada: sesión muerta, se limpia sin ruido.
        if (cancelled) return
        clearSessionHint()
        setUser(null)
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [service])

  // Wire ApiClient's forced-logout (refresh failure) to clear our state.
  useEffect(() => {
    apiClient.setForcedLogoutHandler(clearLocalSession)
  }, [clearLocalSession])

  // Keep real-time authentication in sync when Axios silently rotates a token.
  useEffect(() => {
    apiClient.setTokenRefreshHandler((accessToken) => {
      accessTokenExpiresAtRef.current = jwtExpiresAt(accessToken)
      socketClient.updateToken(accessToken)
    })
    return () => apiClient.setTokenRefreshHandler(null)
  }, [])

  // A tab can remain alive for hours, including when restored from BFCache. On
  // visibility return, exchange the httpOnly refresh cookie before reconnecting
  // so the WebSocket never reuses yesterday's expired access token.
  useEffect(() => {
    const resumeSession = async () => {
      if (!user || document.visibilityState === 'hidden' || isResumingSession.current) return
      const sessionGeneration = sessionGenerationRef.current
      isResumingSession.current = true
      try {
        const { user: refreshedUser, tokens } = await service.refreshSession()
        if (sessionGeneration !== sessionGenerationRef.current) return
        apiClient.setAccessToken(tokens.accessToken)
        accessTokenExpiresAtRef.current = jwtExpiresAt(tokens.accessToken)
        setSessionHint()
        if (!document.hidden) {
          socketClient.connect(tokens.accessToken)
          requestNotificationsRevalidation()
        } else {
          socketClient.updateToken(tokens.accessToken)
        }
        setUser(refreshedUser)
      } catch {
        // Do not force a logout on a transient offline/cold-start failure. The
        // next API request will retry through ApiClient's shared refresh flow.
      } finally {
        isResumingSession.current = false
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now()
        socketClient.suspend()
        return
      }
      const hiddenFor = hiddenAtRef.current === null ? Infinity : Date.now() - hiddenAtRef.current
      hiddenAtRef.current = null
      const tokenIsFresh = accessTokenExpiresAtRef.current > Date.now() + ACCESS_TOKEN_EXPIRY_SKEW_MS
      if (hiddenFor < SESSION_REFRESH_AFTER_HIDDEN_MS && tokenIsFresh) {
        socketClient.resume()
        requestNotificationsRevalidation()
      } else {
        void resumeSession()
      }
    }
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void resumeSession()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [service, user])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const sessionGeneration = ++sessionGenerationRef.current
    resetNotificationsCache()
    setIsLoading(true)
    try {
      const { user: u, tokens } = await service.login(credentials)
      if (sessionGeneration !== sessionGenerationRef.current) return
      apiClient.setAccessToken(tokens.accessToken)
      accessTokenExpiresAtRef.current = jwtExpiresAt(tokens.accessToken)
      socketClient.connect(tokens.accessToken)  // live notifications (Observer FE)
      setSessionHint()  // la credencial la custodia la cookie httpOnly, no nosotros
      setUser(u)
    } finally {
      setIsLoading(false)
    }
  }, [service])

  const register = useCallback((data: RegisterData) => service.register(data), [service])

  const logout = useCallback(async () => {
    sessionGenerationRef.current++
    // H#4 (audit): Optimistic logout — clear UI instantly, fire API in background.
    // El backend lee el refresh exclusivamente desde la cookie httpOnly.
    service.logout().catch(() => {
      // Silently ignore if backend fails to invalidate (e.g. network error)
    })

    // Immediately clear all local state to avoid UI lag
    clearLocalSession()
  }, [clearLocalSession, service])

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    const result = await service.changePassword(data)
    // El backend ya revocó todos los JWT y borró la cookie httpOnly.
    clearLocalSession()
    return result
  }, [clearLocalSession, service])

  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    const updated = await service.updateProfile(data)
    setUser(updated)
    return updated
  }, [service])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      isBootstrapping,
      login,
      register,
      logout,
      changePassword,
      updateProfile,
    }),
    [
      user,
      isLoading,
      isBootstrapping,
      login,
      register,
      logout,
      changePassword,
      updateProfile,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
