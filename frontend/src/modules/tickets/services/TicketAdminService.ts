/**
 * TicketAdminService — concrete ITicketAdminActions using ApiClient.
 * SRP: admin ticket HTTP. DIP: admin UI depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type { ITicketAdminActions } from '../interfaces/ITicketAdminActions'
import type { TicketSummary, TicketDetail, TicketFilterOptions } from '../interfaces/ITicketService'

class TicketAdminService implements ITicketAdminActions {
  async assignTicket(id: string, workerId: string): Promise<TicketDetail> {
    return apiClient.patch<TicketDetail>(`/tickets/${id}/asignar`, { worker_id: Number(workerId) })
  }

  async reassignTicket(id: string, newWorkerId: string): Promise<TicketDetail> {
    return apiClient.patch<TicketDetail>(`/tickets/${id}/reasignar`, { worker_id: Number(newWorkerId) })
  }

  async getAllTickets(
    filters?: TicketFilterOptions & { clienteId?: string; asignadoId?: string },
  ): Promise<TicketSummary[]> {
    const params = new URLSearchParams()
    if (filters?.estado) params.set('estado', filters.estado)
    if (filters?.prioridad) params.set('prioridad', filters.prioridad)
    if (filters?.servicioId) params.set('servicio_id', filters.servicioId)
    if (filters?.fechaDesde) params.set('fecha_desde', filters.fechaDesde)
    if (filters?.fechaHasta) params.set('fecha_hasta', filters.fechaHasta)
    if (filters?.clienteId) params.set('cliente_id', filters.clienteId)
    if (filters?.asignadoId) params.set('asignado_id', filters.asignadoId)
    const qs = params.toString()
    const data = await apiClient.get<{ items: TicketSummary[] }>(`/tickets/${qs ? `?${qs}` : ''}`)
    return data.items
  }
}

export const ticketAdminService = new TicketAdminService()
