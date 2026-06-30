import {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
} from 'react'
import type { ReactNode } from 'react'
import type { INotificationService } from '../interfaces/INotificationService'
import type { Notification } from '../interfaces/types'
import { socketClient } from '../../../infrastructure/websocket/SocketClient'

// ── DIP: service delivered via Context, never imported directly ───────────────

export const NotificationServiceContext = createContext<INotificationService | null>(null)

function useNotificationService(): INotificationService {
  const service = useContext(NotificationServiceContext)
  if (!service) {
    throw new Error(
      'useNotifications must be used inside <NotificationProvider>. ' +
      'Wrap the tree with the provider and inject an INotificationService instance.'
    )
  }
  return service
}

interface NotificationProviderProps {
  service: INotificationService
  children: ReactNode
}

export function NotificationProvider({ service, children }: NotificationProviderProps) {
  return (
    <NotificationServiceContext.Provider value={service}>
      {children}
    </NotificationServiceContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => void
}

// H#21 (audit): Cache timestamp to avoid re-fetching on every mount.
// Stale-while-revalidate: show cached data immediately, refresh in background.
let _lastFetchMs = 0
let _cachedNotifications: Notification[] = []
let _cachedUnreadCount = 0
const STALE_MS = 30_000 // 30 seconds — data is fresh enough to skip re-fetch

export function useNotifications(): UseNotificationsResult {
  const service = useNotificationService()
  const [notifications, setNotifications] = useState<Notification[]>(_cachedNotifications)
  const [unreadCount, setUnreadCount] = useState(_cachedUnreadCount)
  const [isLoading, setIsLoading] = useState(_cachedNotifications.length === 0)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (force = false) => {
    // Skip re-fetch if data is still fresh (unless forced)
    const now = Date.now()
    if (!force && _cachedNotifications.length > 0 && now - _lastFetchMs < STALE_MS) {
      return
    }
    if (_cachedNotifications.length === 0) setIsLoading(true)
    setError(null)
    try {
      const data = await service.getUserNotifications(1)
      _cachedNotifications = data.items
      _cachedUnreadCount = data.unreadCount
      _lastFetchMs = Date.now()
      setNotifications(data.items)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [service])

  useEffect(() => { refresh().catch(console.error) }, [refresh])

  // Observer (FE): react to live 'notification_new' frames from the WS singleton.
  useEffect(() => {
    const off = socketClient.subscribe('notification_new', (payload) => {
      const incoming = payload as Notification
      setNotifications((prev) => [incoming, ...prev])
      setUnreadCount((c) => c + 1)
    })
    return off
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await service.markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [service])

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.leida)
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
    setUnreadCount(0)
    await Promise.all(unread.map((n) => service.markAsRead(n.id)))
  }, [service, notifications])

  return { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead, refresh }
}
