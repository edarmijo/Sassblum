import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('../../../infrastructure/http/ApiClient', () => ({
  apiClient: apiClientMock,
}))

import { ticketAdminService } from './TicketAdminService'

function backendDetail(estado: string, asignadoNombre: string) {
  return {
    id: 10,
    numero: 'T-2026-0010',
    asunto: 'Incidente de red',
    estado,
    prioridad: 'Alta',
    servicio_nombre: 'Soporte de red',
    creado_en: '2026-08-10T15:00:00Z',
    descripcion: 'No existe conectividad en la oficina principal.',
    cliente_nombre: 'Cliente de prueba',
    asignado_nombre: asignadoNombre,
    adjuntos: [],
    eventos: [],
    actualizado_en: '2026-08-10T15:05:00Z',
  }
}

describe('TicketAdminService assignment contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps the initial assignment response and exposes the worker in camelCase', async () => {
    apiClientMock.patch.mockResolvedValue(backendDetail('EnProceso', 'Ana Técnica'))

    const ticket = await ticketAdminService.assignTicket('10', '3')

    expect(apiClientMock.patch).toHaveBeenCalledWith('/tickets/10/asignar', { worker_id: 3 })
    expect(ticket.estado).toBe('EnProceso')
    expect(ticket.asignadoNombre).toBe('Ana Técnica')
    expect(ticket.servicioNombre).toBe('Soporte de red')
  })

  it.each(['EnProceso', 'EnEspera', 'Resuelto', 'Cerrado'] as const)(
    'maps reassignment while preserving the %s state',
    async (estado) => {
      apiClientMock.patch.mockResolvedValue(backendDetail(estado, 'Luis Técnico'))

      const ticket = await ticketAdminService.reassignTicket('10', '7')

      expect(apiClientMock.patch).toHaveBeenCalledWith('/tickets/10/reasignar', { worker_id: 7 })
      expect(ticket.estado).toBe(estado)
      expect(ticket.asignadoNombre).toBe('Luis Técnico')
    },
  )

  it('maps admin ticket summaries instead of leaking the backend DTO shape', async () => {
    apiClientMock.get.mockResolvedValue({ items: [backendDetail('EnEspera', 'Ana Técnica')] })

    const tickets = await ticketAdminService.getAllTickets()

    expect(tickets[0]).toMatchObject({
      id: '10',
      estado: 'EnEspera',
      servicioNombre: 'Soporte de red',
      creadoEn: '2026-08-10T15:00:00Z',
    })
  })
})
