/**
 * TicketAdminService — concrete ITicketAdminActions using ApiClient.
 * SRP: admin ticket HTTP. DIP: admin UI depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type { ITicketAdminActions } from '../interfaces/ITicketAdminActions'
import type { TicketSummary, TicketDetail, TicketFilterOptions } from '../interfaces/ITicketService'
import {
  mapTicketDetail,
  mapTicketSummary,
  type BackendTicketDetail,
  type BackendTicketSummary,
} from './ticketMappers'
import { buildTicketListQuery } from './ticketListQuery'

class TicketAdminService implements ITicketAdminActions {
  async assignTicket(id: string, workerId: string): Promise<TicketDetail> {
    const data = await apiClient.patch<BackendTicketDetail>(`/tickets/${id}/asignar`, {
      worker_id: Number(workerId),
    })
    return mapTicketDetail(data)
  }

  async reassignTicket(id: string, newWorkerId: string): Promise<TicketDetail> {
    const data = await apiClient.patch<BackendTicketDetail>(`/tickets/${id}/reasignar`, {
      worker_id: Number(newWorkerId),
    })
    return mapTicketDetail(data)
  }

  async getAllTickets(
    filters?: TicketFilterOptions & { clienteId?: string; asignadoId?: string },
  ): Promise<TicketSummary[]> {
    const data = await apiClient.get<{ items: BackendTicketSummary[] }>(
      `/tickets/${buildTicketListQuery(filters)}`,
    )
    return data.items.map(mapTicketSummary)
  }
}

export const ticketAdminService = new TicketAdminService()
