import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { vi } from 'vitest'
import { useNotifications, NotificationProvider } from './useNotifications'
import type { INotificationService } from '../interfaces/INotificationService'
import type { PaginatedNotifications } from '../interfaces/types'

// Capture the subscribe handler so we can simulate an incoming WS frame.
let wsHandler: ((payload: unknown) => void) | null = null
vi.mock('../../../infrastructure/websocket/SocketClient', () => ({
  socketClient: {
    subscribe: (_event: string, handler: (p: unknown) => void) => {
      wsHandler = handler
      return () => { wsHandler = null }
    },
  },
}))

function makeService(): INotificationService {
  const page: PaginatedNotifications = {
    items: [
      { id: '1', tipo: 'creacion', titulo: 'A', cuerpo: 'b', leida: false, payload: {}, creadoEn: new Date().toISOString() },
    ],
    total: 1,
    unreadCount: 1,
    page: 1,
  }
  return {
    getUserNotifications: vi.fn().mockResolvedValue(page),
    markAsRead: vi.fn().mockResolvedValue(page.items[0]),
    getPreferences: vi.fn(),
    setPreferences: vi.fn(),
  }
}

function wrapper(service: INotificationService) {
  return ({ children }: { children: ReactNode }) => (
    <NotificationProvider service={service}>{children}</NotificationProvider>
  )
}

describe('useNotifications', () => {
  it('loads notifications and unread count on mount', async () => {
    const service = makeService()
    const { result } = renderHook(() => useNotifications(), { wrapper: wrapper(service) })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.unreadCount).toBe(1)
  })

  it('markAsRead calls the service and decrements the count', async () => {
    const service = makeService()
    const { result } = renderHook(() => useNotifications(), { wrapper: wrapper(service) })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => { await result.current.markAsRead('1') })

    expect(service.markAsRead).toHaveBeenCalledWith('1')
    expect(result.current.unreadCount).toBe(0)
  })

  it('an incoming WS notification is prepended and bumps the count', async () => {
    const service = makeService()
    const { result } = renderHook(() => useNotifications(), { wrapper: wrapper(service) })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      wsHandler?.({
        id: '2', tipo: 'comentario', titulo: 'Nuevo', cuerpo: 'c',
        leida: false, payload: {}, creadoEn: new Date().toISOString(),
      })
    })

    expect(result.current.notifications[0].id).toBe('2')
    expect(result.current.unreadCount).toBe(2)
  })
})
