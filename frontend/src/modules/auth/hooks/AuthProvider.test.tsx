import { StrictMode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser, IAuthService } from '../interfaces/IAuthService'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

const apiClientMocks = vi.hoisted(() => ({
  setAccessToken: vi.fn(),
  setForcedLogoutHandler: vi.fn(),
  setTokenRefreshHandler: vi.fn(),
}))

const socketClientMocks = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  updateToken: vi.fn(),
  suspend: vi.fn(),
  resume: vi.fn(),
}))

vi.mock('../../../infrastructure/http/ApiClient', () => ({ apiClient: apiClientMocks }))
vi.mock('../../../infrastructure/websocket/SocketClient', () => ({ socketClient: socketClientMocks }))
vi.mock('../../notifications/hooks/useNotifications', () => ({
  requestNotificationsRevalidation: vi.fn(),
  resetNotificationsCache: vi.fn(),
}))

const SESSION_HINT_KEY = 'sb_has_session'
const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1_000

const user: AuthUser = {
  id: '7',
  email: 'cliente@sassblum.test',
  nombre: 'Vicky',
  apellido: 'Pinto',
  ruc: '',
  empresa: 'SassBlum',
  rol: 'CLIENTE',
  estado: 'ACTIVO',
  emailVerificado: true,
}

const restoredSession = {
  user,
  tokens: { accessToken: 'access-token' },
}

function createService(refreshSession: IAuthService['refreshSession']): IAuthService {
  const unavailable = async (): Promise<never> => {
    throw new Error('Operation not used by this test')
  }

  return {
    login: unavailable,
    register: unavailable,
    logout: unavailable,
    forgotPassword: unavailable,
    resetPassword: unavailable,
    verifyEmail: unavailable,
    updateProfile: unavailable,
    refreshSession,
  }
}

function deferred<T>() {
  let resolvePromise: (value: T) => void = () => undefined
  let rejectPromise: (reason?: unknown) => void = () => undefined
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  return { promise, resolve: resolvePromise, reject: rejectPromise }
}

function AuthStateProbe() {
  const { user: currentUser, isBootstrapping } = useAuth()
  return (
    <div>
      <span>{isBootstrapping ? 'restoring' : 'ready'}</span>
      <span>{currentUser?.email ?? 'guest'}</span>
    </div>
  )
}

describe('AuthProvider session bootstrap', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('does not contact the backend when there is no previous-session hint', () => {
    const refreshSession = vi.fn(async () => restoredSession)

    render(
      <AuthProvider service={createService(refreshSession)}>
        <AuthStateProbe />
      </AuthProvider>,
    )

    expect(screen.getByText('ready')).toBeInTheDocument()
    expect(screen.getByText('guest')).toBeInTheDocument()
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it('restores a valid session and replaces the legacy hint with an expiring timestamp', async () => {
    localStorage.setItem(SESSION_HINT_KEY, '1')
    const refreshSession = vi.fn(async () => restoredSession)

    render(
      <AuthProvider service={createService(refreshSession)}>
        <AuthStateProbe />
      </AuthProvider>,
    )

    expect(screen.getByText('restoring')).toBeInTheDocument()
    expect(await screen.findByText(user.email)).toBeInTheDocument()
    expect(screen.getByText('ready')).toBeInTheDocument()
    expect(apiClientMocks.setAccessToken).toHaveBeenCalledWith('access-token')
    expect(socketClientMocks.connect).toHaveBeenCalledWith('access-token')
    expect(Number(localStorage.getItem(SESSION_HINT_KEY))).toBeGreaterThan(1)
  })

  it('clears an invalid session and releases the route boundary', async () => {
    localStorage.setItem(SESSION_HINT_KEY, '1')
    const refreshSession = vi.fn(async () => {
      throw new Error('Expired session')
    })

    render(
      <AuthProvider service={createService(refreshSession)}>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument())
    expect(screen.getByText('guest')).toBeInTheDocument()
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
  })

  it('discards a stale hint without making the user wait for the network', () => {
    const now = new Date('2026-08-15T12:00:00Z').getTime()
    vi.spyOn(Date, 'now').mockReturnValue(now)
    localStorage.setItem(SESSION_HINT_KEY, String(now - EIGHT_DAYS_MS - 1))
    const refreshSession = vi.fn(async () => restoredSession)

    render(
      <AuthProvider service={createService(refreshSession)}>
        <AuthStateProbe />
      </AuthProvider>,
    )

    expect(screen.getByText('ready')).toBeInTheDocument()
    expect(refreshSession).not.toHaveBeenCalled()
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
  })

  it('deduplicates the initial refresh when React StrictMode replays effects', async () => {
    localStorage.setItem(SESSION_HINT_KEY, '1')
    const attempt = deferred<typeof restoredSession>()
    const refreshSession = vi.fn(() => attempt.promise)

    render(
      <StrictMode>
        <AuthProvider service={createService(refreshSession)}>
          <AuthStateProbe />
        </AuthProvider>
      </StrictMode>,
    )

    expect(refreshSession).toHaveBeenCalledTimes(1)
    attempt.resolve(restoredSession)

    await waitFor(() => expect(screen.getByText(user.email)).toBeInTheDocument())
    expect(refreshSession).toHaveBeenCalledTimes(1)
  })
})
