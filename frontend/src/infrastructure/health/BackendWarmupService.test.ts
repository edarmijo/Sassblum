import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BackendWarmupService } from './BackendWarmupService'

const HEALTHY_RESPONSE = { status: 'healthy', database: 'ok' }

function healthyResponse(): Response {
  return new Response(JSON.stringify(HEALTHY_RESPONSE), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('BackendWarmupService', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('checks the API health endpoint with a lightweight unauthenticated request', async () => {
    fetchMock.mockResolvedValue(healthyResponse())
    const service = new BackendWarmupService(fetchMock)

    await service.start()

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/health\/$/),
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
      }),
    )
  })

  it('shares one request while the backend is waking up', async () => {
    let finishRequest: ((response: Response) => void) | undefined
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => {
      finishRequest = resolve
    }))
    const service = new BackendWarmupService(fetchMock)

    const first = service.start()
    const second = service.start()
    expect(fetchMock).toHaveBeenCalledOnce()

    finishRequest?.(healthyResponse())
    await Promise.all([first, second])
  })

  it('skips another check while the recent readiness result is still valid', async () => {
    fetchMock.mockResolvedValue(healthyResponse())
    const service = new BackendWarmupService(fetchMock)

    await service.start()
    await service.start()

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('does not trust a cached readiness timestamp from the future', async () => {
    localStorage.setItem('sassblum:backend-ready-at', String(Date.now() + 60_000))
    fetchMock.mockResolvedValue(healthyResponse())
    const service = new BackendWarmupService(fetchMock)

    await service.start()

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('swallows network failures because warm-up must never break the app', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const service = new BackendWarmupService(fetchMock)

    await expect(service.start()).resolves.toBeUndefined()
  })

  it('backs off after a failed check instead of blocking every API request again', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const service = new BackendWarmupService(fetchMock)

    await service.start()
    await service.start()

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('lets an API request continue while a long warm-up remains in flight', async () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => undefined))
    const service = new BackendWarmupService(fetchMock)

    await expect(service.waitUntilReady(1)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('waits for connectivity and retries once the browser is online', async () => {
    let online = false
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online)
    fetchMock.mockResolvedValue(healthyResponse())
    const service = new BackendWarmupService(fetchMock)

    await service.start()
    expect(fetchMock).not.toHaveBeenCalled()

    online = true
    window.dispatchEvent(new Event('online'))
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
  })
})
