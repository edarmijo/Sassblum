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

class ApiClient {
  private readonly http: AxiosInstance
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private onForcedLogout: (() => void) | null = null
  private isRefreshing = false

  constructor() {
    this.http = axios.create({
      baseURL: env.apiBaseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60_000, // 60s — Render free tier duerme la instancia y tarda ~30-50s en despertar
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
          this.refreshToken &&
          !original._retry &&
          !this.isRefreshing
        ) {
          original._retry = true
          const refreshed = await this.tryRefresh()
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

  private forceLogout(): void {
    this.setTokens(null, null)
    this.onForcedLogout?.()
  }

  private async tryRefresh(): Promise<boolean> {
    this.isRefreshing = true
    try {
      // H#4 (audit): Send device fingerprint with refresh token for binding.
      // simplejwt rotation + blacklist mitigates token theft.
      const fingerprint = this._getDeviceFingerprint()
      const { data } = await axios.post(`${env.apiBaseUrl}/auth/token/refresh`, {
        refresh: this.refreshToken,
      }, {
        headers: fingerprint ? { 'X-Device-Id': fingerprint } : {},
        // Must match the main client timeout — without this, a sleeping Render
        // instance causes tryRefresh() to hang indefinitely, blocking the
        // original request's Promise and producing an infinite spinner.
        timeout: 60_000,
      })
      this.accessToken = data.access
      return true
    } catch {
      return false
    } finally {
      this.isRefreshing = false
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
