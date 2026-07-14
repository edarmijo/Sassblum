import { createContext, useContext } from 'react'
import type { IAuthService } from '../interfaces/IAuthService'

/**
 * AuthServiceContext — DIP seam for auth pages.
 *
 * El componente AuthServiceProvider vive en AuthServiceProvider.tsx (Fast Refresh:
 * un archivo exporta solo componentes o solo hooks). Las páginas consumen
 * IAuthService a través de este contexto — nunca importan la clase concreta.
 * SOLID: DIP.
 */
export const AuthServiceContext = createContext<IAuthService | null>(null)

export function useAuthService(): IAuthService {
  const service = useContext(AuthServiceContext)
  if (!service) {
    throw new Error('Auth pages must be wrapped in <AuthServiceProvider>.')
  }
  return service
}
