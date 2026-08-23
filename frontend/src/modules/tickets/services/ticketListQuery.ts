import { querySuffix } from '../../../core/utils/query'
import type { TicketFilterOptions } from '../interfaces/ITicketService'

const FILTER_PARAMETER_NAMES = {
  estado: 'estado',
  prioridad: 'prioridad',
  servicioId: 'servicio_id',
  fechaDesde: 'fecha_desde',
  fechaHasta: 'fecha_hasta',
  clienteId: 'cliente_id',
  asignadoId: 'asignado_id',
  // H#6 (admin): filtros avanzados por datos del cliente
  clienteRuc: 'cliente_ruc',
  clienteEmail: 'cliente_email',
  clienteEmpresa: 'cliente_empresa',
} as const satisfies Record<keyof TicketFilterOptions, string>

/** Builds the canonical query string shared by client and admin ticket lists. */
export function buildTicketListQuery(filters?: TicketFilterOptions): string {
  const params = new URLSearchParams()
  if (!filters) return querySuffix(params)

  for (const [filterName, parameterName] of Object.entries(FILTER_PARAMETER_NAMES)) {
    const value = filters[filterName as keyof TicketFilterOptions]
    if (value) params.set(parameterName, value)
  }

  return querySuffix(params)
}
