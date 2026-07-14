/**
 * NotificationProvider — separado de useNotifications.tsx para que cada archivo
 * exporte solo componentes o solo hooks (Fast Refresh). DIP: inyecta INotificationService.
 */

import type { ReactNode } from 'react'
import type { INotificationService } from '../interfaces/INotificationService'
import { NotificationServiceContext } from './useNotifications'

interface NotificationProviderProps {
  service: INotificationService
  children: ReactNode
}

export function NotificationProvider({ service, children }: Readonly<NotificationProviderProps>) {
  return (
    <NotificationServiceContext.Provider value={service}>
      {children}
    </NotificationServiceContext.Provider>
  )
}
