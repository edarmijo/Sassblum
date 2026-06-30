import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { IAuthService } from '../interfaces/IAuthService'

/**
 * AuthServiceContext — DIP seam for auth pages.
 *
 * Until the full useAuth hook (Sprint 1 · S6) lands, the password-reset pages
 * consume IAuthService through this context. The app root injects a concrete
 * AuthService (or a mock in tests) — pages never import the concrete class.
 * SOLID: DIP.
 */
export const AuthServiceContext = createContext<IAuthService | null>(null)

interface AuthServiceProviderProps {
  service: IAuthService
  children: ReactNode
}

export function AuthServiceProvider({ service, children }: AuthServiceProviderProps) {
  return (
    <AuthServiceContext.Provider value={service}>
      {children}
    </AuthServiceContext.Provider>
  )
}

export function useAuthService(): IAuthService {
  const service = useContext(AuthServiceContext)
  if (!service) {
    throw new Error('Auth pages must be wrapped in <AuthServiceProvider>.')
  }
  return service
}
