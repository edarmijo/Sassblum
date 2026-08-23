import type {
  AttachmentMeta,
  TicketDetail,
  TicketEstado,
  TicketEvent,
  TicketPrioridad,
  TicketSummary,
} from '../interfaces/ITicketService'

export interface BackendTicketSummary {
  id: number
  numero: string
  asunto: string
  estado: string
  prioridad: string
  servicio_nombre: string
  creado_en: string
  // H#6 (admin): presentes solo en contexto admin
  cliente_email?: string
  cliente_empresa?: string
  cliente_ruc?: string
  asignado_nombre?: string | null
  asignado_email?: string | null
}

export interface BackendTicketEvent {
  id: number
  tipo_evento: string
  estado_anterior: string | null
  estado_nuevo: string | null
  comentario: string
  autor_nombre: string
  creado_en: string
}

interface BackendAttachment {
  id: number
  nombre_archivo: string
  url: string
  tamaño_bytes: number
  mime_type: string
}

export interface BackendTicketDetail extends BackendTicketSummary {
  descripcion: string
  cliente_nombre: string
  asignado_nombre: string | null
  adjuntos: BackendAttachment[]
  eventos: BackendTicketEvent[]
  actualizado_en: string
}

export function mapTicketSummary(ticket: BackendTicketSummary): TicketSummary {
  return {
    id: String(ticket.id),
    numero: ticket.numero,
    asunto: ticket.asunto,
    estado: ticket.estado as TicketEstado,
    prioridad: ticket.prioridad as TicketPrioridad,
    servicioNombre: ticket.servicio_nombre,
    creadoEn: ticket.creado_en,
    // H#6 (admin): campos opcionales
    clienteEmail: ticket.cliente_email,
    clienteEmpresa: ticket.cliente_empresa,
    clienteRuc: ticket.cliente_ruc,
    asignadoNombre: ticket.asignado_nombre,
    asignadoEmail: ticket.asignado_email,
  }
}

export function mapTicketEvent(event: BackendTicketEvent): TicketEvent {
  return {
    id: String(event.id),
    tipoEvento: event.tipo_evento,
    estadoAnterior: (event.estado_anterior || null) as TicketEstado | null,
    estadoNuevo: (event.estado_nuevo || null) as TicketEstado | null,
    comentario: event.comentario,
    autorNombre: event.autor_nombre,
    creadoEn: event.creado_en,
  }
}

function mapAttachment(attachment: BackendAttachment): AttachmentMeta {
  return {
    id: String(attachment.id),
    nombreArchivo: attachment.nombre_archivo,
    url: attachment.url,
    tamañoBytes: attachment.tamaño_bytes,
    mimeType: attachment.mime_type,
  }
}

export function mapTicketDetail(ticket: BackendTicketDetail): TicketDetail {
  return {
    ...mapTicketSummary(ticket),
    descripcion: ticket.descripcion,
    clienteNombre: ticket.cliente_nombre,
    asignadoNombre: ticket.asignado_nombre,
    adjuntos: (ticket.adjuntos ?? []).map(mapAttachment),
    eventos: (ticket.eventos ?? []).map(mapTicketEvent),
    actualizadoEn: ticket.actualizado_en,
  }
}
