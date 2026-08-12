/**
 * TicketService — concrete ITicketClientActions using ApiClient.
 * SRP: ticket HTTP + shape mapping. DIP: useTickets depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type { ITicketClientActions } from '../interfaces/ITicketClientActions'
import type {
  TicketCreatePayload,
  TicketSummary,
  TicketDetail,
  TicketEvent,
  TicketFilterOptions,
  TicketEstado,
} from '../interfaces/ITicketService'
import {
  mapTicketDetail,
  mapTicketEvent,
  mapTicketSummary,
  type BackendTicketDetail,
  type BackendTicketEvent,
  type BackendTicketSummary,
} from './ticketMappers'
import { buildTicketListQuery } from './ticketListQuery'

class TicketService implements ITicketClientActions {
  /** H#3 (cliente): Cambiar estado de ticket con observación (worker/admin). */
  async updateStatus(id: string, newStatus: TicketEstado, comment: string): Promise<TicketDetail> {
    const data = await apiClient.patch<BackendTicketDetail>(`/tickets/${id}/estado`, {
      estado: newStatus,
      comentario: comment,
    })
    return mapTicketDetail(data)
  }

  /** Agregar comentario sin cambiar estado (worker/admin). */
  async addComment(id: string, comment: string): Promise<TicketEvent> {
    const data = await apiClient.post<BackendTicketEvent>(`/tickets/${id}/comentario`, {
      comentario: comment,
    })
    return mapTicketEvent(data)
  }

  async createTicket(payload: TicketCreatePayload): Promise<TicketDetail> {
    const form = new FormData()
    form.append('asunto', payload.asunto)
    form.append('descripcion', payload.descripcion)
    form.append('servicio_id', payload.servicioId)
    form.append('prioridad', payload.prioridad)
    for (const file of payload.adjuntos ?? []) form.append('adjuntos', file)

    const data = await apiClient.post<BackendTicketDetail>('/tickets/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapTicketDetail(data)
  }

  async getMyTickets(filters?: TicketFilterOptions): Promise<TicketSummary[]> {
    const data = await apiClient.get<{ items: BackendTicketSummary[] }>(
      `/tickets/${buildTicketListQuery(filters)}`,
    )
    return data.items.map(mapTicketSummary)
  }

  async getTicketDetail(id: string): Promise<TicketDetail> {
    const data = await apiClient.get<BackendTicketDetail>(`/tickets/${id}`)
    return mapTicketDetail(data)
  }
}

export const ticketService = new TicketService()
