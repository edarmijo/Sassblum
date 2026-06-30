/**
 * apiError — extract a human-readable message from an Axios error.
 *
 * Handles the three shapes the backend can return:
 *   - DRF domain error:      { detail: "..." }
 *   - DRF serializer error:  { campo: ["msg", ...], ... }
 *   - No response (network/CORS/server down): a connection message.
 */

import { AxiosError } from 'axios'

export function apiError(err: unknown, fallback = 'Ocurrió un error.'): string {
  if (err instanceof AxiosError) {
    // No response → network error, CORS block, or server not running
    if (!err.response) {
      return 'No se pudo conectar con el servidor. ¿Está el backend corriendo en http://localhost:8000?'
    }
    const data = err.response.data as unknown
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      if (typeof obj.detail === 'string') return obj.detail
      // Serializer field errors: take the first field's first message
      for (const value of Object.values(obj)) {
        if (Array.isArray(value) && value.length && typeof value[0] === 'string') {
          return value[0]
        }
        if (typeof value === 'string') return value
      }
    }
    return `Error ${err.response.status}: ${fallback}`
  }
  return err instanceof Error ? err.message : fallback
}
