/**
 * Typed environment access. Single source of truth for runtime config.
 * No module reads import.meta.env directly except here.
 */

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  wsUrl: import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000',
} as const
