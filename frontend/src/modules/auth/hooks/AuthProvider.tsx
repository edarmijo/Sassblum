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
 *   Mientras dura ese canje `isBootstrapping` es true y App.tsx no monta nada
 *   autenticado (evitaría peticiones sin Bearer → 401 en cascada).
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import type {
  IAuthService,
  LoginCredentials,
  RegisterData,
  AuthUser,
  ProfileUpdateData,
} from '../interfaces/IAuthService'
import { authService as defaultAuthService } from '../services/AuthService'
import { apiClient } from '../../../infrastructure/http/ApiClient'
import { socketClient } from '../../../infrastructure/websocket/SocketClient'
import { AuthContext } from './useAuth'

/** Pista no sensible: "hubo una sesión aquí". Evita rehidratar en visitas anónimas. */
const SESSION_HINT_KEY = 'sb_has_session'
/** Claves heredadas — se purgan al arrancar: guardaban tokens en disco (BUG-06). */
const LEGACY_KEYS = ['auth_tokens', 'auth_session', 'auth_user']

function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

function setSessionHint(): void {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1')
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
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(hasSessionHint)

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

    let cancelled = false
    void (async () => {
      try {
        const { user: u, tokens } = await service.refreshSession()
        if (cancelled) return
        apiClient.setTokens(tokens.accessToken, tokens.refreshToken || null)
        socketClient.connect(tokens.accessToken)
        setRefreshToken(tokens.refreshToken || null)
        setUser(u)
      } catch {
        // Cookie ausente, vencida o revocada: sesión muerta, se limpia sin ruido.
        if (cancelled) return
        clearSessionHint()
        setUser(null)
        setRefreshToken(null)
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
    apiClient.setForcedLogoutHandler(() => {
      clearSessionHint()
      socketClient.disconnect()
      setUser(null)
      setRefreshToken(null)
    })
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const { user: u, tokens } = await service.login(credentials)
      apiClient.setTokens(tokens.accessToken, tokens.refreshToken)
      socketClient.connect(tokens.accessToken)  // live notifications (Observer FE)
      setSessionHint()  // la credencial la custodia la cookie httpOnly, no nosotros
      setRefreshToken(tokens.refreshToken)
      setUser(u)
    } finally {
      setIsLoading(false)
    }
  }, [service])

  const register = useCallback((data: RegisterData) => service.register(data), [service])

  const logout = useCallback(async () => {
    // H#4 (audit): Optimistic logout — clear UI instantly, fire API in background.
    // El backend lee el refresh de la cookie; el valor en memoria es respaldo.
    service.logout(refreshToken ?? '').catch(() => {
      // Silently ignore if backend fails to invalidate (e.g. network error)
    })

    // Immediately clear all local state to avoid UI lag
    apiClient.setTokens(null, null)
    socketClient.disconnect()
    clearSessionHint()
    setUser(null)
    setRefreshToken(null)
  }, [service, refreshToken])

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
      updateProfile,
    }),
    [user, isLoading, isBootstrapping, login, register, logout, updateProfile],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
