/**
 * Starts Render as early as possible without coupling health checks to JWT.
 * One GET both verifies an active instance and wakes a sleeping one.
 */

import { env } from '../config/env'

const HEALTH_CACHE_KEY = 'sassblum:backend-ready-at'
const HEALTH_CACHE_TTL_MS = 10 * 60 * 1_000
const HEALTH_TIMEOUT_MS = 55_000
const HEALTH_FAILURE_BACKOFF_MS = 30_000
export const API_WARMUP_WAIT_MS = 1_200

interface HealthResponse {
  status: 'healthy'
  database: 'ok'
}

function isHealthyResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) return false
  const response = value as Record<string, unknown>
  return response.status === 'healthy' && response.database === 'ok'
}

function healthUrl(): string {
  return `${env.apiBaseUrl.replace(/\/$/, '')}/health/`
}

export class BackendWarmupService {
  private readonly fetcher: typeof fetch
  private inFlight: Promise<void> | null = null
  private waitingForOnline = false
  private retryAfter = 0

  constructor(fetcher: typeof fetch = globalThis.fetch.bind(globalThis)) {
    this.fetcher = fetcher
  }

  /** Starts at most one availability check and never rejects into the UI. */
  start(): Promise<void> {
    if (this.wasRecentlyReady() || Date.now() < this.retryAfter) {
      return Promise.resolve()
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.retryWhenOnline()
      return Promise.resolve()
    }

    this.inFlight ??= this.checkAvailability().finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  /**
   * Gives the proactive wake-up a small head start without putting every API
   * request behind Render's complete health-check timeout.
   */
  async waitUntilReady(maxWaitMs = API_WARMUP_WAIT_MS): Promise<void> {
    let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined
    try {
      await Promise.race([
        this.start(),
        new Promise<void>((resolve) => {
          timeoutId = globalThis.setTimeout(resolve, Math.max(0, maxWaitMs))
        }),
      ])
    } finally {
      if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId)
    }
  }

  private async checkAvailability(): Promise<void> {
    const controller = new AbortController()
    const timeoutId = globalThis.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

    try {
      const response = await this.fetcher(healthUrl(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal,
      })
      if (!response.ok) {
        this.deferRetry()
        return
      }

      const payload: unknown = await response.json()
      if (isHealthyResponse(payload)) {
        this.retryAfter = 0
        this.rememberReady()
      } else {
        this.deferRetry()
      }
    } catch {
      // Background optimization only: login and the public site must still work.
      this.deferRetry()
    } finally {
      globalThis.clearTimeout(timeoutId)
    }
  }

  private wasRecentlyReady(): boolean {
    try {
      const readyAt = Number.parseInt(localStorage.getItem(HEALTH_CACHE_KEY) ?? '', 10)
      const age = Date.now() - readyAt
      return Number.isFinite(readyAt) && age >= 0 && age < HEALTH_CACHE_TTL_MS
    } catch {
      return false
    }
  }

  private rememberReady(): void {
    try {
      localStorage.setItem(HEALTH_CACHE_KEY, String(Date.now()))
    } catch {
      // Storage can be unavailable in private browsing; in-memory dedupe still works.
    }
  }

  private deferRetry(): void {
    this.retryAfter = Date.now() + HEALTH_FAILURE_BACKOFF_MS
  }

  private retryWhenOnline(): void {
    if (this.waitingForOnline || typeof window === 'undefined') return
    this.waitingForOnline = true
    window.addEventListener('online', () => {
      this.waitingForOnline = false
      void this.start()
    }, { once: true })
  }
}

export const backendWarmupService = new BackendWarmupService()
