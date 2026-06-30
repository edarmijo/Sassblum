import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { NotificationBell } from './index'
import { NotificationServiceContext } from '../../hooks/useNotifications'
import type { INotificationService } from '../../interfaces/INotificationService'
import type { PaginatedNotifications } from '../../interfaces/types'

// Mock the socket singleton so subscribe is a no-op returning an unsubscribe fn.
vi.mock('../../../../infrastructure/websocket/SocketClient', () => ({
  socketClient: { subscribe: vi.fn(() => () => {}) },
}))

function makeService(unread: number): INotificationService {
  const page: PaginatedNotifications = {
    items: [
      {
        id: '1', tipo: 'creacion', titulo: 'Nuevo ticket', cuerpo: 'cuerpo',
        leida: unread === 0, payload: {}, creadoEn: new Date().toISOString(),
      },
    ],
    total: 1,
    unreadCount: unread,
    page: 1,
  }
  return {
    getUserNotifications: vi.fn().mockResolvedValue(page),
    markAsRead: vi.fn().mockResolvedValue(page.items[0]),
    getPreferences: vi.fn().mockResolvedValue({ emailActivo: true, inAppActivo: true, wsActivo: true }),
    setPreferences: vi.fn(),
  }
}

function renderBell(service: INotificationService) {
  return render(
    <NotificationServiceContext.Provider value={service}>
      <NotificationBell />
    </NotificationServiceContext.Provider>
  )
}

describe('NotificationBell', () => {
  it('renders the bell button', () => {
    renderBell(makeService(0))
    expect(screen.getByRole('button', { name: /notificaciones/i })).toBeInTheDocument()
  })

  it('shows the unread badge with the count', async () => {
    renderBell(makeService(3))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /3 sin leer/i })).toBeInTheDocument()
    })
  })

  it('does not show a badge when there are no unread', async () => {
    renderBell(makeService(0))
    await waitFor(() => {
      expect(screen.queryByText(/sin leer/i)).not.toBeInTheDocument()
    })
  })

  it('opens the panel on click', async () => {
    renderBell(makeService(1))
    await userEvent.click(screen.getByRole('button', { name: /notificaciones/i }))
    expect(await screen.findByRole('dialog', { name: /notificaciones/i })).toBeInTheDocument()
  })
})
