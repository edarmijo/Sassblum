import type { UserRole } from '../../modules/auth/interfaces/IAuthService'

/**
 * Destino raíz de cada rol dentro de la app autenticada.
 *
 * SRP: única fuente de verdad para la pregunta "¿cuál es el panel de este
 * usuario?". La consumen el Navbar (ítem de menú), el redirect de `/app` y los
 * enlaces de "volver" de las pantallas hoja, que antes duplicaban el mapa y
 * podían desincronizarse.
 */
export interface DashboardRoute {
  /** Ruta del panel. */
  to: string
  /** Etiqueta en mayúsculas para la navegación principal. */
  label: string
  /** Texto del enlace de retorno hacia ese panel. */
  backLabel: string
}

const BY_ROLE: Record<UserRole, DashboardRoute> = {
  CLIENTE: { to: '/mis-tickets', label: 'MIS TICKETS', backLabel: 'Volver a mis tickets' },
  TRABAJADOR: { to: '/panel', label: 'PANEL', backLabel: 'Volver al panel' },
  ADMINISTRADOR: { to: '/admin', label: 'ADMIN', backLabel: 'Volver a la administración' },
}

/** Sin sesión el "panel" es el sitio público: nunca devuelve una ruta protegida. */
const ANONYMOUS: DashboardRoute = { to: '/', label: 'INICIO', backLabel: 'Volver al inicio' }

export function dashboardRoute(rol: UserRole | null | undefined): DashboardRoute {
  return rol ? BY_ROLE[rol] : ANONYMOUS
}
