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
import { backendWarmupService } from '../health/BackendWarmupService'

type TokenRefreshHandler = (accessToken: string) => void

class ApiClient {
  private readonly http: AxiosInstance
  private accessToken: string | null = null
  private onForcedLogout: (() => void) | null = null
  private onTokenRefreshed: TokenRefreshHandler | null = null
  private refreshPromise: Promise<boolean> | null = null
  private sessionVersion = 0

  constructor() {
    this.http = axios.create({
      baseURL: env.apiBaseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60_000, // 60s — Render free tier duerme la instancia y tarda ~30-50s en despertar
      // BUG-06: el refresh token viaja en cookie httpOnly; sin esto el navegador
      // no la adjunta y la sesión no sobrevive a una recarga.
      withCredentials: true,
    })

    this.http.interceptors.request.use(async (config) => {
      // Reuse the startup health request instead of racing it with login,
      // session refresh, or catalog calls while Render is waking up. Calling
      // start() here also covers a tab left open past Render's idle timeout.
      // The health request is only a head start. Public catalog/login calls
      // continue after a short bound even if Render's health endpoint is slow.
      await backendWarmupService.waitUntilReady()
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
          this.accessToken !== null &&
          !original.url?.includes('/auth/token/refresh') &&
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

  setAccessToken(access: string | null): void {
    this.sessionVersion++
    this.accessToken = access
  }

  setForcedLogoutHandler(handler: () => void): void {
    this.onForcedLogout = handler
  }

  /** Notifies the auth boundary after a silent cookie-based token refresh. */
  setTokenRefreshHandler(handler: TokenRefreshHandler | null): void {
    this.onTokenRefreshed = handler
  }

  private forceLogout(): void {
    this.setAccessToken(null)
    this.onForcedLogout?.()
  }

  private refreshAccessToken(): Promise<boolean> {
    this.refreshPromise ??= this.tryRefresh().finally(() => {
      this.refreshPromise = null
    })
    return this.refreshPromise
  }

  private async tryRefresh(): Promise<boolean> {
    const sessionVersion = this.sessionVersion
    try {
      const { data } = await axios.post(`${env.apiBaseUrl}/auth/token/refresh`, {}, {
        // Must match the main client timeout — without this, a sleeping Render
        // instance causes tryRefresh() to hang indefinitely, blocking the
        // original request's Promise and producing an infinite spinner.
        timeout: 60_000,
        withCredentials: true, // sin esto el navegador no manda la cookie
      })
      if (sessionVersion !== this.sessionVersion) return this.accessToken !== null
      this.accessToken = data.access
      this.onTokenRefreshed?.(data.access)
      return true
    } catch {
      if (sessionVersion !== this.sessionVersion) return this.accessToken !== null
      return false
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
