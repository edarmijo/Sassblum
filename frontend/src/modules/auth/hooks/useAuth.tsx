/**
 * useAuth — auth Context + hook. JWT lives ONLY in memory here (never localStorage).
 *
 * SRP: holds the session state and exposes login/register/logout.
 * DIP: depends on IAuthService (injected, defaults to the concrete authService).
 * Pattern: Singleton (Context) + Observer (reactive state).
 * Security: Tokens and user are persisted to localStorage so sessions survive page reloads.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import type { ReactNode } from 'react'
import type {
  IAuthService,
  AuthUser,
  LoginCredentials,
  RegisterData,
} from '../interfaces/IAuthService'
import { authService as defaultAuthService } from '../services/AuthService'
import { apiClient } from '../../../infrastructure/http/ApiClient'
import { socketClient } from '../../../infrastructure/websocket/SocketClient'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<{ message: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
  service?: IAuthService
}

export function AuthProvider({ children, service = defaultAuthService }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth_user')
    return saved ? JSON.parse(saved) : null
  })
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('auth_tokens')
    return saved ? JSON.parse(saved).refreshToken : null
  })
  const [isLoading, setIsLoading] = useState(false)

  // Restore API and Socket tokens on mount if available
  useEffect(() => {
    const savedTokens = localStorage.getItem('auth_tokens')
    if (savedTokens) {
      try {
        const tokens = JSON.parse(savedTokens)
        apiClient.setTokens(tokens.accessToken, tokens.refreshToken)
        socketClient.connect(tokens.accessToken)
      } catch (err) {
        console.warn('Sesión guardada ilegible; se descarta y se pide login de nuevo.', err)
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('auth_user')
      }
    }
  }, [])

  // Wire ApiClient's forced-logout (refresh failure) to clear our state.
  useEffect(() => {
    apiClient.setForcedLogoutHandler(() => {
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('auth_user')
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
      localStorage.setItem('auth_tokens', JSON.stringify(tokens))
      localStorage.setItem('auth_user', JSON.stringify(u))
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
    localStorage.removeItem('auth_tokens')
    localStorage.removeItem('auth_user')
    setUser(null)
    setRefreshToken(null)
  }, [service, refreshToken])

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.')
  return ctx
}
