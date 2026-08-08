import type { ReactNode } from 'react'
import type { IClientLogoService } from '../interfaces/IClientLogoService'
import { ClientLogoServiceContext } from './useClientLogo'

/** Dependency-injection boundary for client-logo pages. */
export function ClientLogoProvider({ service, children }: Readonly<{ service: IClientLogoService; children: ReactNode }>) {
  return <ClientLogoServiceContext.Provider value={service}>{children}</ClientLogoServiceContext.Provider>
}
