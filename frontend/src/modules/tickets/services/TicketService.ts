/**
 * TicketService — concrete ITicketClientActions using ApiClient.
 * SRP: ticket HTTP + shape mapping. DIP: useTickets depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import { querySuffix } from '../../../core/utils/query'
import type { ITicketClientActions } from '../interfaces/ITicketClientActions'
import type {
  TicketCreatePayload,
  TicketSummary,
  TicketDetail,
  TicketEvent,
  TicketFilterOptions,
  TicketEstado,
  TicketPrioridad,
  AttachmentMeta,
} from '../interfaces/ITicketService'

interface BeSummary {
  id: number
  numero: string
  asunto: string
  estado: string
  prioridad: string
  servicio_nombre: string
  creado_en: string
}
interface BeEvent {
  id: number
  tipo_evento: string
  estado_anterior: string | null
  estado_nuevo: string | null
  comentario: string
  autor_nombre: string
  creado_en: string
}
interface BeAttachment {
  id: number
  nombre_archivo: string
  url: string
  tamaño_bytes: number
  mime_type: string
}
interface BeDetail extends BeSummary {
  descripcion: string
  cliente_nombre: string
  asignado_nombre: string | null
  adjuntos: BeAttachment[]
  eventos: BeEvent[]
  actualizado_en: string
}

function mapSummary(t: BeSummary): TicketSummary {
  return {
    id: String(t.id),
    numero: t.numero,
    asunto: t.asunto,
    estado: t.estado as TicketEstado,
    prioridad: t.prioridad as TicketPrioridad,
    servicioNombre: t.servicio_nombre,
    creadoEn: t.creado_en,
  }
}
function mapEvent(e: BeEvent): TicketEvent {
  return {
    id: String(e.id),
    tipoEvento: e.tipo_evento,
    estadoAnterior: (e.estado_anterior || null) as TicketEstado | null,
    estadoNuevo: (e.estado_nuevo || null) as TicketEstado | null,
    comentario: e.comentario,
    autorNombre: e.autor_nombre,
    creadoEn: e.creado_en,
  }
}
function mapAttachment(a: BeAttachment): AttachmentMeta {
  return {
    id: String(a.id),
    nombreArchivo: a.nombre_archivo,
    url: a.url,
    tamañoBytes: a.tamaño_bytes,
    mimeType: a.mime_type,
  }
}
function mapDetail(t: BeDetail): TicketDetail {
  return {
    ...mapSummary(t),
    descripcion: t.descripcion,
    clienteNombre: t.cliente_nombre,
    asignadoNombre: t.asignado_nombre,
    adjuntos: (t.adjuntos ?? []).map(mapAttachment),
    eventos: (t.eventos ?? []).map(mapEvent),
    actualizadoEn: t.actualizado_en,
  }
}

class TicketService implements ITicketClientActions {
  /** H#3 (cliente): Cambiar estado de ticket con observación (worker/admin). */
  async updateStatus(id: string, newStatus: TicketEstado, comment: string): Promise<TicketDetail> {
    const data = await apiClient.patch<BeDetail>(`/tickets/${id}/estado`, {
      estado: newStatus,
      comentario: comment,
    })
    return mapDetail(data)
  }

  /** Agregar comentario sin cambiar estado (worker/admin). */
  async addComment(id: string, comment: string): Promise<TicketEvent> {
    const data = await apiClient.post<BeEvent>(`/tickets/${id}/comentario`, {
      comentario: comment,
    })
    return mapEvent(data)
  }

  async createTicket(payload: TicketCreatePayload): Promise<TicketDetail> {
    const form = new FormData()
    form.append('asunto', payload.asunto)
    form.append('descripcion', payload.descripcion)
    form.append('servicio_id', payload.servicioId)
    form.append('prioridad', payload.prioridad)
    for (const file of payload.adjuntos ?? []) form.append('adjuntos', file)

    const data = await apiClient.post<BeDetail>('/tickets/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapDetail(data)
  }

  async getMyTickets(filters?: TicketFilterOptions): Promise<TicketSummary[]> {
    const params = new URLSearchParams()
    if (filters?.estado) params.set('estado', filters.estado)
    if (filters?.prioridad) params.set('prioridad', filters.prioridad)
    if (filters?.servicioId) params.set('servicio_id', filters.servicioId)
    if (filters?.fechaDesde) params.set('fecha_desde', filters.fechaDesde)
    if (filters?.fechaHasta) params.set('fecha_hasta', filters.fechaHasta)
    if (filters?.clienteId) params.set('cliente_id', filters.clienteId)
    if (filters?.asignadoId) params.set('asignado_id', filters.asignadoId)
    const data = await apiClient.get<{ items: BeSummary[] }>(`/tickets/${querySuffix(params)}`)
    return data.items.map(mapSummary)
  }

  async getTicketDetail(id: string): Promise<TicketDetail> {
    const data = await apiClient.get<BeDetail>(`/tickets/${id}`)
    return mapDetail(data)
  }
}

export const ticketService = new TicketService()
