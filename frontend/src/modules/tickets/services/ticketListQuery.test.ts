import { describe, expect, it } from 'vitest'
import { buildTicketListQuery } from './ticketListQuery'

describe('buildTicketListQuery', () => {
  it('returns an empty suffix when filters are absent', () => {
    expect(buildTicketListQuery()).toBe('')
  })

  it('maps all UI filter names to the backend query contract', () => {
    const query = buildTicketListQuery({
      estado: 'EnProceso',
      prioridad: 'Alta',
      servicioId: '5',
      fechaDesde: '2026-08-01',
      fechaHasta: '2026-08-31',
      clienteId: '12',
      asignadoId: '9',
    })

    expect(query).toBe(
      '?estado=EnProceso&prioridad=Alta&servicio_id=5&fecha_desde=2026-08-01&fecha_hasta=2026-08-31&cliente_id=12&asignado_id=9',
    )
  })
})
