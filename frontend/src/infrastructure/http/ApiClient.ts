/**
 * ApiClient — Axios singleton with JWT interceptors.
 *
 * Responsibility (SRP): one configured HTTP client for the whole app.
 *   - Request interceptor injects `Authorization: Bearer <access>`.
 *   - Response interceptor on 401 tries a refresh once, then retries; on failure
 *     it clears the session and notifies the logout handler.
 * Security: the access token lives ONLY in memory here (never localStorage — XSS).
 * Pattern: Singleton. SOLID: SRP · DIP (modules depend on this, not on axios).
 *
 * useAuth wires the tokens and the onForcedLogout callback.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { env } from '../config/env'

type TokenRefreshHandler = (accessToken: string, refreshToken: string | null) => void

class ApiClient {
  private readonly http: AxiosInstance
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private onForcedLogout: (() => void) | null = null
  private onTokenRefreshed: TokenRefreshHandler | null = null
  private refreshPromise: Promise<boolean> | null = null

  constructor() {
    this.http = axios.create({
      baseURL: env.apiBaseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60_000, // 60s — Render free tier duerme la instancia y tarda ~30-50s en despertar
      // BUG-06: el refresh token viaja en cookie httpOnly; sin esto el navegador
      // no la adjunta y la sesión no sobrevive a una recarga.
      withCredentials: true,
    })

    this.http.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`
      }
      return config
    })

    this.http.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config as AxiosRequestConfig & { _retry?: boolean }
        if (
          error.response?.status === 401 &&
          !original._retry
        ) {
          original._retry = true
          const refreshed = await this.refreshAccessToken()
          if (refreshed) {
            original.headers = original.headers ?? {}
              ; (original.headers as Record<string, string>).Authorization = `Bearer ${this.accessToken}`
            return this.http(original)
          }
          this.forceLogout()
        }
        throw error
      },
    )
  }

  // ── Token / session wiring (called by useAuth) ──────────────────────────────

  setTokens(access: string | null, refresh: string | null): void {
    this.accessToken = access
    this.refreshToken = refresh
  }

  setForcedLogoutHandler(handler: () => void): void {
    this.onForcedLogout = handler
  }

  /** Notifies the auth boundary after a silent cookie-based token refresh. */
  setTokenRefreshHandler(handler: TokenRefreshHandler | null): void {
    this.onTokenRefreshed = handler
  }

  private forceLogout(): void {
    this.setTokens(null, null)
    this.onForcedLogout?.()
  }

  private refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise === null) {
      this.refreshPromise = this.tryRefresh().finally(() => {
        this.refreshPromise = null
      })
    }
    return this.refreshPromise
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      // H#4 (audit): Send device fingerprint with refresh token for binding.
      // simplejwt rotation + blacklist mitigates token theft.
      const fingerprint = this._getDeviceFingerprint()
      const { data } = await axios.post(`${env.apiBaseUrl}/auth/token/refresh`, {
        // Respaldo en memoria: si la cookie httpOnly está presente, el backend
        // la prefiere e ignora este campo (BUG-06).
        refresh: this.refreshToken ?? undefined,
      }, {
        headers: fingerprint ? { 'X-Device-Id': fingerprint } : {},
        // Must match the main client timeout — without this, a sleeping Render
        // instance causes tryRefresh() to hang indefinitely, blocking the
        // original request's Promise and producing an infinite spinner.
        timeout: 60_000,
        withCredentials: true, // sin esto el navegador no manda la cookie
      })
      this.accessToken = data.access
      // La rotación emite un refresh nuevo; el viejo queda en blacklist.
      if (data.refresh) this.refreshToken = data.refresh
      this.onTokenRefreshed?.(data.access, this.refreshToken)
      return true
    } catch {
      return false
    }
  }

  /** H#4: Generate a simple device fingerprint for token binding. */
  private _getDeviceFingerprint(): string {
    try {
      const nav = typeof navigator === 'undefined' ? null : navigator
      const screen = globalThis.window === undefined ? null : globalThis.window.screen
      const parts = [
        nav?.userAgent ?? '',
        nav?.language ?? '',
        screen?.width ?? 0,
        screen?.height ?? 0,
        new Date().getTimezoneOffset(),
      ]
      // Simple hash — not cryptographic, just a binding signal
      let hash = 0
      const str = parts.join('|')
      for (let i = 0; i < str.length; i++) {
        hash = Math.trunc(((hash << 5) - hash + (str.codePointAt(i) ?? 0)))
      }
      return `fp-${Math.abs(hash).toString(36)}`
    } catch {
      return ''
    }
  }

  // ── Verb helpers ────────────────────────────────────────────────────────────

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.get<T>(url, config)).data
  }

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.post<T>(url, body, config)).data
  }

  async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.patch<T>(url, body, config)).data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.delete<T>(url, config)).data
  }
}

// Single shared instance (Singleton)
export const apiClient = new ApiClient()
