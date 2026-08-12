import {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
} from 'react'
import type { INotificationService } from '../interfaces/INotificationService'
import type { Notification } from '../interfaces/types'
import { socketClient } from '../../../infrastructure/websocket/SocketClient'

// ── DIP: service delivered via Context, never imported directly ───────────────
// El componente NotificationProvider vive en NotificationProvider.tsx (Fast Refresh).

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

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

// H#21 (audit): Cache timestamp to avoid re-fetching on every mount.
// Stale-while-revalidate: show cached data immediately, refresh in background.
let _lastFetchMs = 0
let _cachedNotifications: Notification[] = []
let _cachedUnreadCount = 0
let _inFlightFetch: Promise<void> | null = null
let _socketSequence = 0
let _mutationRevision = 0
let _fetchSequence = 0
let _incomingEvents: Array<{ sequence: number; notification: Notification }> = []
type NotificationSnapshotListener = (items: Notification[], unreadCount: number) => void
const _snapshotListeners = new Set<NotificationSnapshotListener>()
let _socketOff: (() => void) | null = null

function publishSnapshot(): void {
  _snapshotListeners.forEach((listener) => {
    listener(_cachedNotifications, _cachedUnreadCount)
  })
}

function ensureSocketObserver(): void {
  if (_socketOff !== null) return
  _socketOff = socketClient.subscribe('notification_new', (payload) => {
    const incoming = payload as Notification
    _socketSequence++
    _incomingEvents.push({ sequence: _socketSequence, notification: incoming })
    _cachedNotifications = [incoming, ..._cachedNotifications]
    _cachedUnreadCount += 1
    publishSnapshot()
  })
}

function fetchNotifications(service: INotificationService): Promise<void> {
  if (_inFlightFetch !== null) return _inFlightFetch
  const startingSocketSequence = _socketSequence
  const startingMutationRevision = _mutationRevision
  const fetchSequence = ++_fetchSequence
  _inFlightFetch = service.getUserNotifications(1)
    .then((data) => {
      if (startingMutationRevision !== _mutationRevision) return
      const incoming = _incomingEvents
        .filter((event) => event.sequence > startingSocketSequence)
        .map((event) => event.notification)
      const incomingIds = new Set(incoming.map((notification) => notification.id))
      _cachedNotifications = [
        ...incoming,
        ...data.items.filter((notification) => !incomingIds.has(notification.id)),
      ]
      _cachedUnreadCount = data.unreadCount + incoming.filter((notification) => !notification.leida).length
      _lastFetchMs = Date.now()
      _incomingEvents = []
      publishSnapshot()
    })
    .finally(() => {
      if (fetchSequence === _fetchSequence) _inFlightFetch = null
    })
  return _inFlightFetch
}

export function requestNotificationsRevalidation(): void {
  window.dispatchEvent(new Event('sassblum:notifications-revalidate'))
}
const STALE_MS = 30_000 // 30 seconds — data is fresh enough to skip re-fetch

/** Vacía el caché módulo-level (logout y aislamiento entre tests). */
export function resetNotificationsCache(): void {
  _lastFetchMs = 0
  _cachedNotifications = []
  _cachedUnreadCount = 0
  _inFlightFetch = null
  _fetchSequence++
  _socketSequence = 0
  _mutationRevision++
  _incomingEvents = []
  publishSnapshot()
}

export function useNotifications(): UseNotificationsResult {
  const service = useNotificationService()
  const [notifications, setNotifications] = useState<Notification[]>(_cachedNotifications)
  const [unreadCount, setUnreadCount] = useState(_cachedUnreadCount)
  const [isLoading, setIsLoading] = useState(_lastFetchMs === 0)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (force = false) => {
    // Skip re-fetch if data is still fresh (unless forced)
    const now = Date.now()
    if (!force && _lastFetchMs > 0 && now - _lastFetchMs < STALE_MS) {
      return
    }
    if (_lastFetchMs === 0) setIsLoading(true)
    setError(null)
    try {
      await fetchNotifications(service)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [service])

  useEffect(() => { refresh().catch(console.error) }, [refresh])

  useEffect(() => {
    const revalidate = () => { refresh(true).catch(console.error) }
    window.addEventListener('sassblum:notifications-revalidate', revalidate)
    return () => window.removeEventListener('sassblum:notifications-revalidate', revalidate)
  }, [refresh])

  // Observer (FE): react to live 'notification_new' frames from the WS singleton.
  useEffect(() => {
    const listener: NotificationSnapshotListener = (items, count) => {
      setNotifications(items)
      setUnreadCount(count)
    }
    _snapshotListeners.add(listener)
    ensureSocketObserver()
    return () => {
      _snapshotListeners.delete(listener)
      if (_snapshotListeners.size === 0 && _socketOff !== null) {
        _socketOff()
        _socketOff = null
      }
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await service.markAsRead(id)
    const wasUnread = _cachedNotifications.some((n) => n.id === id && !n.leida)
    _cachedNotifications = _cachedNotifications.map((n) => (n.id === id ? { ...n, leida: true } : n))
    if (wasUnread) _cachedUnreadCount = Math.max(0, _cachedUnreadCount - 1)
    _mutationRevision++
    publishSnapshot()
  }, [service])

  const markAllAsRead = useCallback(async () => {
    const previousNotifications = _cachedNotifications
    const previousUnreadCount = _cachedUnreadCount
    const previousIds = new Set(previousNotifications.map((notification) => notification.id))
    _cachedNotifications = _cachedNotifications.map((n) => ({ ...n, leida: true }))
    _cachedUnreadCount = 0
    _mutationRevision++
    publishSnapshot()
    try {
      await service.markAllAsRead()
    } catch (error) {
      const newNotifications = _cachedNotifications.filter((notification) => !previousIds.has(notification.id))
      _cachedNotifications = [...newNotifications, ...previousNotifications]
      _cachedUnreadCount = previousUnreadCount + newNotifications.filter((notification) => !notification.leida).length
      _mutationRevision++
      publishSnapshot()
      throw error
    }
  }, [service])

  return { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead, refresh }
}
