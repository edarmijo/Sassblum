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
const MAX_BACKOFF_MS = 30_000

class SocketClient {
  private socket: WebSocket | null = null
  private token: string | null = null
  private handlers = new Map<string, Set<EventHandler>>()
  private backoff = 1_000
  private shouldReconnect = false

  /** Open the connection with the user's access token. Idempotent. */
  connect(token: string): void {
    this.token = token
    this.shouldReconnect = true
    this.open()
  }

  private open(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return

    const url = `${WS_BASE}/ws/notifications/?token=${encodeURIComponent(this.token ?? '')}`
    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      this.backoff = 1_000 // reset backoff on a successful connection
    }

    this.socket.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { event?: string; payload?: unknown }
        if (data.event) this.emit(data.event, data.payload)
      } catch {
        // ignore malformed frames
      }
    }

    this.socket.onclose = () => {
      this.socket = null
      if (this.shouldReconnect) {
        setTimeout(() => this.open(), this.backoff)
        this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS)
      }
    }

    this.socket.onerror = () => {
      this.socket?.close()
    }
  }

  /** Close the connection and stop reconnecting. */
  disconnect(): void {
    this.shouldReconnect = false
    this.socket?.close()
    this.socket = null
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
