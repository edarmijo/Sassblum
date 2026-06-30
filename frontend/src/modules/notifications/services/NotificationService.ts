/**
 * NotificationService — concrete INotificationService using ApiClient.
 * SRP: notification HTTP + shape mapping. DIP: useNotifications depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type { INotificationService } from '../interfaces/INotificationService'
import type {
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
  NotificationTipo,
} from '../interfaces/types'

interface BeNotification {
  id: number
  tipo: string
  titulo: string
  cuerpo: string
  leida: boolean
  payload: Record<string, unknown>
  creado_en: string
}

function mapNotification(n: BeNotification): Notification {
  return {
    id: String(n.id),
    tipo: n.tipo as NotificationTipo,
    titulo: n.titulo,
    cuerpo: n.cuerpo,
    leida: n.leida,
    payload: n.payload ?? {},
    creadoEn: n.creado_en,
  }
}

class NotificationService implements INotificationService {
  async getUserNotifications(page = 1): Promise<PaginatedNotifications> {
    const data = await apiClient.get<{
      items: BeNotification[]
      total: number
      unread_count: number
      page: number
    }>(`/notificaciones/?page=${page}`)
    return {
      items: data.items.map(mapNotification),
      total: data.total,
      unreadCount: data.unread_count,
      page: data.page,
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const data = await apiClient.patch<BeNotification>(
      `/notificaciones/${notificationId}/marcar-leida`,
    )
    return mapNotification(data)
  }

  async getPreferences(): Promise<NotificationPreferences> {
    const data = await apiClient.get<{
      email_activo: boolean
      in_app_activo: boolean
      ws_activo: boolean
    }>('/notificaciones/preferencias')
    return {
      emailActivo: data.email_activo,
      inAppActivo: data.in_app_activo,
      wsActivo: data.ws_activo,
    }
  }

  async setPreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const body: Record<string, boolean> = {}
    if (data.emailActivo !== undefined) body.email_activo = data.emailActivo
    if (data.inAppActivo !== undefined) body.in_app_activo = data.inAppActivo
    if (data.wsActivo !== undefined) body.ws_activo = data.wsActivo
    const res = await apiClient.patch<{
      email_activo: boolean
      in_app_activo: boolean
      ws_activo: boolean
    }>('/notificaciones/preferencias', body)
    return {
      emailActivo: res.email_activo,
      inAppActivo: res.in_app_activo,
      wsActivo: res.ws_activo,
    }
  }
}

export const notificationService = new NotificationService()
