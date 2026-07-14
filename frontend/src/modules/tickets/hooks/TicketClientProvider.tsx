/**
 * TicketClientProvider — separado de useTickets.tsx para que cada archivo
 * exporte solo componentes o solo hooks (Fast Refresh). DIP: inyecta ITicketClientActions.
 */

import type { ReactNode } from 'react'
import type { ITicketClientActions } from '../interfaces/ITicketClientActions'
import { TicketClientContext } from './useTickets'

interface TicketClientProviderProps {
  service: ITicketClientActions
  children: ReactNode
}

export function TicketClientProvider({ service, children }: Readonly<TicketClientProviderProps>) {
  return (
    <TicketClientContext.Provider value={service}>
      {children}
    </TicketClientContext.Provider>
  )
}
