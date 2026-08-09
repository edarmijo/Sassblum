/**
 * SocketClient — singleton WebSocket client for live notifications.
 *
 * Responsibility (SRP): manage one WS connection and fan out events to subscribers.
 *     No business logic, no DOM — pure transport + pub/sub.
 * Pattern: Singleton + Observer subject (the FE side of the Observer pattern).
 * SOLID: SRP · DIP (hooks depend on this abstraction, not on raw WebSocket)
 *
 * Reconnect: exponential backoff (1s → 2s → 4s … capped at 30s) on unexpected close.
 *
 * Usage:
 *   import { socketClient } from '@/infrastructure/websocket/SocketClient'
 *   socketClient.connect(accessToken)
 *   const off = socketClient.subscribe('notification_new', (payload) => { ... })
 *   off() // unsubscribe
 */

type EventHandler = (payload: unknown) => void

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'
// El access token viaja como subprotocolo (header Sec-WebSocket-Protocol), NUNCA
// en la query string: las URLs quedan en logs del proxy/servidor y en la consola
// del navegador, y eso filtra la credencial. Debe coincidir con
// backend/apps/realtime/auth.py (JWT_SUBPROTOCOL).
const JWT_SUBPROTOCOL = 'sassblum.jwt'
const MAX_BACKOFF_MS = 30_000
// Tras N intentos fallidos consecutivos se deja de reintentar (evita spam infinito
// en consola cuando el servidor no tiene WS disponible). Un nuevo connect() —
// p. ej. al re-loguear — reinicia el ciclo.
const MAX_RETRIES = 6

class SocketClient {
  private socket: WebSocket | null = null
  private token: string | null = null
  private readonly handlers = new Map<string, Set<EventHandler>>()
  private backoff = 1_000
  private retries = 0
  private shouldReconnect = false
  private isSuspended = false
  private reconnectTimer: number | null = null

  constructor() {
    // A WebSocket keeps a page out of the Back-Forward Cache unless it is
    // explicitly closed. Close it while the page is frozen and create a fresh
    // transport when the user returns with the browser navigation controls.
    window.addEventListener('pagehide', this.handlePageHide)
  }

  /** Open the connection with the user's access token. Idempotent. */
  connect(token: string): void {
    const tokenChanged = this.token !== null && this.token !== token
    this.token = token
    this.shouldReconnect = true
    this.isSuspended = false
    this.retries = 0
    if (tokenChanged) this.closeCurrentSocket()
    this.open()
  }

  private open(): void {
    if (this.isSuspended) return
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return

    const urlObj = new URL('/ws/notifications/', WS_BASE)
    const socket = this.token
      ? new WebSocket(urlObj.toString(), [JWT_SUBPROTOCOL, this.token])
      : new WebSocket(urlObj.toString())
    this.socket = socket

    socket.onopen = () => {
      this.backoff = 1_000 // reset backoff on a successful connection
      this.retries = 0
    }

    socket.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { event?: string; payload?: unknown }
        if (data.event) this.emit(data.event, data.payload)
      } catch {
        // ignore malformed frames
      }
    }

    socket.onclose = () => {
      // A socket replaced after token rotation must not affect the new one.
      if (this.socket !== socket) return
      this.socket = null
      if (!this.shouldReconnect || this.isSuspended) return
      this.retries += 1
      if (this.retries >= MAX_RETRIES) {
        // El servidor no ofrece WS ahora mismo (p. ej. sin Redis). La app sigue
        // funcionando sin tiempo real; se reintentará en el próximo login.
        this.shouldReconnect = false
        return
      }
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null
        this.open()
      }, this.backoff)
      this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS)
    }

    socket.onerror = () => {
      socket.close()
    }
  }

  /** Close the connection and stop reconnecting. */
  disconnect(): void {
    this.shouldReconnect = false
    this.isSuspended = false
    this.clearReconnectTimer()
    this.closeCurrentSocket()
  }

  /** Pause a live connection while the document is being frozen or hidden. */
  suspend(): void {
    this.isSuspended = true
    this.clearReconnectTimer()
    this.closeCurrentSocket()
  }

  private handlePageHide = (event: PageTransitionEvent): void => {
    if (!event.persisted) return
    this.suspend()
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private closeCurrentSocket(): void {
    const socket = this.socket
    this.socket = null
    socket?.close()
  }

  /** Subscribe to a server event. Returns an unsubscribe function. */
  subscribe(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return () => this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, payload: unknown): void {
    this.handlers.get(event)?.forEach((h) => h(payload))
  }
}

// Single shared instance (Singleton)
export const socketClient = new SocketClient()
export type { EventHandler }
