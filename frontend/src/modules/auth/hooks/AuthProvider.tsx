/**
 * AuthProvider — separado de useAuth.tsx para que cada archivo exporte solo
 * componentes o solo hooks (react-refresh/only-export-components).
 *
 * SRP: holds the session state and exposes login/register/logout.
 * DIP: depends on IAuthService (injected, defaults to the concrete authService).
 *
 * Security (BUG-06, paso 1):
 *   El ACCESS TOKEN nunca toca el disco — vive solo en memoria dentro de ApiClient.
 *   Solo el refresh token se persiste, para poder rehidratar la sesión al recargar.
 *   Al montar se canjea ese refresh por un access nuevo; mientras dura ese canje
 *   `isBootstrapping` es true y App.tsx no monta nada autenticado (evita peticiones
 *   sin Bearer que devolverían 401).
 *
 *   Persistir el refresh en localStorage sigue siendo una exposición a XSS; el paso 2
 *   lo mueve a una cookie httpOnly. Este paso elimina la parte aguda del problema:
 *   ya no se restaura un access token viejo en cada recarga.
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

/** Solo el refresh token. Clave nueva: la vieja `auth_tokens` guardaba el access. */
const SESSION_KEY = 'auth_session'
const USER_KEY = 'auth_user'
/** Clave heredada — se purga al arrancar para no dejar access tokens viejos en disco. */
const LEGACY_TOKENS_KEY = 'auth_tokens'

function readStoredRefresh(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw).refreshToken ?? null) : null
  } catch {
    return null
  }
}

function persistSession(refreshToken: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ refreshToken }))
}

function clearStoredSession(): void {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_TOKENS_KEY)
}

interface AuthProviderProps {
  children: ReactNode
  service?: IAuthService
}

export function AuthProvider({ children, service = defaultAuthService }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [refreshToken, setRefreshToken] = useState<string | null>(readStoredRefresh)
  const [isLoading, setIsLoading] = useState(false)
  // Solo hay que rehidratar si quedó un refresh token de una sesión anterior.
  const [isBootstrapping, setIsBootstrapping] = useState(() => readStoredRefresh() !== null)

  // Rehidratación: canjea el refresh persistido por un access nuevo (en memoria).
  useEffect(() => {
    // Purga cualquier access token dejado por la versión anterior (BUG-06).
    localStorage.removeItem(LEGACY_TOKENS_KEY)

    const stored = readStoredRefresh()
    if (!stored) return

    let cancelled = false
    void (async () => {
      try {
        const tokens = await service.refreshTokens(stored)
        if (cancelled) return
        apiClient.setTokens(tokens.accessToken, tokens.refreshToken)
        socketClient.connect(tokens.accessToken)
        // ROTATE_REFRESH_TOKENS=True → el backend devuelve un refresh nuevo.
        persistSession(tokens.refreshToken)
        setRefreshToken(tokens.refreshToken)
      } catch {
        // Refresh vencido o revocado: sesión muerta, se limpia sin ruido.
        if (cancelled) return
        clearStoredSession()
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
      clearStoredSession()
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
      persistSession(tokens.refreshToken)       // el access NO se persiste
      localStorage.setItem(USER_KEY, JSON.stringify(u))
      setRefreshToken(tokens.refreshToken)
      setUser(u)
    } finally {
      setIsLoading(false)
    }
  }, [service])

  const register = useCallback((data: RegisterData) => service.register(data), [service])

  const logout = useCallback(async () => {
    // H#4 (audit): Optimistic logout — clear UI instantly, fire API in background.
    if (refreshToken) {
      service.logout(refreshToken).catch(() => {
        // Silently ignore if backend fails to invalidate (e.g. network error)
      })
    }

    // Immediately clear all local state to avoid UI lag
    apiClient.setTokens(null, null)
    socketClient.disconnect()
    clearStoredSession()
    setUser(null)
    setRefreshToken(null)
  }, [service, refreshToken])

  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    const updated = await service.updateProfile(data)
    // Refresca el estado de sesión y la copia persistida (para recargas)
    localStorage.setItem(USER_KEY, JSON.stringify(updated))
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
