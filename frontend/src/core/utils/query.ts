/**
 * Helpers de query string compartidos por los services HTTP.
 */

/** `?a=b` si hay parámetros; cadena vacía si no. */
export function querySuffix(params: URLSearchParams): string {
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}
