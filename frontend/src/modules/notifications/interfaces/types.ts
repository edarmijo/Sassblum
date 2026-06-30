/**
 * Shared notification types for the frontend notifications module.
 * Mirrors the backend Notification / NotificationPreference shapes.
 */

export type NotificationTipo =
  | 'creacion'
  | 'asignacion'
  | 'cambio_estado'
  | 'comentario'
  | 'reasignacion'
  | 'password_reset'
  | 'informacion'

export interface Notification {
  id: string
  tipo: NotificationTipo
  titulo: string
  cuerpo: string
  leida: boolean
  payload: Record<string, unknown>
  creadoEn: string // ISO 8601
}

export interface NotificationPreferences {
  emailActivo: boolean
  inAppActivo: boolean
  wsActivo: boolean
}

export interface PaginatedNotifications {
  items: Notification[]
  total: number
  unreadCount: number
  page: number
}
