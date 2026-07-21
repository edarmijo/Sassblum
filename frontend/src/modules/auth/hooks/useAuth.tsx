/**
 * useAuth — auth Context + hook (el AuthProvider vive en AuthProvider.tsx para
 * que cada archivo exporte solo componentes o solo hooks — Fast Refresh).
 *
 * SRP: expone el estado de sesión y las acciones login/register/logout.
 * DIP: los consumidores dependen de AuthContextValue, nunca del AuthService concreto.
 */

import { createContext, useContext } from 'react'
import type {
  AuthUser,
  LoginCredentials,
  RegisterData,
  ProfileUpdateData,
} from '../interfaces/IAuthService'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  /**
   * True mientras se canjea el refresh token persistido por un access nuevo
   * (solo al montar, y solo si había sesión previa). Nada autenticado debe
   * montarse en ese lapso: aún no hay Bearer y las peticiones darían 401.
   */
  isBootstrapping: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<{ message: string }>
  logout: () => Promise<void>
  /** Edita el perfil propio y refresca el usuario en sesión. */
  updateProfile: (data: ProfileUpdateData) => Promise<AuthUser>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.')
  return ctx
}
