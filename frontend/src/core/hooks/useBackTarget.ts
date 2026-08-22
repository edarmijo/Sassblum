import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Origen sembrado por quien navegó hasta la pantalla actual.
 *
 * Se sanea igual que `?next=` en el router: solo rutas internas, nunca
 * protocolo-relativas (`//host`), para que un state manipulado no se convierta
 * en un open redirect.
 */
export function originFrom(state: unknown): string | null {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : null
}

/**
 * React Router numera sus entradas en `history.state.idx`. Un índice mayor que
 * cero prueba que existe una entrada anterior creada por esta misma sesión de
 * la SPA; con cero (enlace de correo, pestaña nueva, recarga) un `-1` sacaría
 * al usuario del sitio.
 */
function hasInternalHistory(): boolean {
  const idx = (globalThis.history?.state as { idx?: unknown } | null)?.idx
  return typeof idx === 'number' && idx > 0
}

export interface BackTarget {
  /** Ruta de retorno garantizada, válida aunque no haya historial previo. */
  to: string
  /** Ejecuta el retorno por la vía que preserve más contexto. */
  go: () => void
}

/**
 * Resuelve el retorno de una pantalla hoja.
 *
 * Prefiere `history.back()` cuando el origen es interno y conocido, porque así
 * se conservan scroll, pestaña activa y filtros de la pantalla anterior sin
 * duplicar entradas en el historial. En cualquier otro caso navega al destino
 * semántico: es la única opción correcta cuando se llega por enlace directo.
 */
export function useBackTarget(fallback: string): BackTarget {
  const navigate = useNavigate()
  const { state, pathname } = useLocation()
  const candidate = originFrom(state)
  // Un origen que apunta a esta misma pantalla (recarga, o abrirla de nuevo
  // desde sí misma) no es un retorno: se descarta y manda el destino semántico,
  // que es el que describe la etiqueta visible.
  const origin = candidate && candidate.split('?')[0] !== pathname ? candidate : null
  const to = origin ?? fallback

  const go = useCallback(() => {
    if (origin && hasInternalHistory()) navigate(-1)
    else navigate(to)
  }, [navigate, origin, to])

  return { to, go }
}

/**
 * State a pasar al navegar hacia una pantalla hoja, para que su enlace de
 * "volver" pueda regresar exactamente a esta vista (con su pestaña y filtros)
 * en lugar de al destino genérico del rol.
 */
export function useOriginState(): { from: string } {
  const { pathname, search } = useLocation()
  return { from: `${pathname}${search}` }
}
