/**
 * AuthServiceProvider — separado de useAuthService.tsx para que cada archivo
 * exporte solo componentes o solo hooks (Fast Refresh). DIP: inyecta IAuthService.
 */

import type { ReactNode } from 'react'
import type { IAuthService } from '../interfaces/IAuthService'
import { AuthServiceContext } from './useAuthService'

interface AuthServiceProviderProps {
  service: IAuthService
  children: ReactNode
}

export function AuthServiceProvider({ service, children }: Readonly<AuthServiceProviderProps>) {
  return (
    <AuthServiceContext.Provider value={service}>
      {children}
    </AuthServiceContext.Provider>
  )
}
