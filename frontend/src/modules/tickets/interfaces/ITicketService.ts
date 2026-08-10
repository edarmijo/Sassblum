/**
 * Root contract for all ticket operations in the frontend.
 *
 * Responsibility (SRP): declare the complete ticket operation contract + shared types.
 *     No HTTP calls, no state management — only method signatures and data shapes.
 * Depends on: nothing — root abstraction.
 * Pattern: DIP anchor — TicketService (Singleton) will implement this in S12.
 * SOLID: DIP · OCP · LSP
 *
 * ISP note (S15):
 *     Three role-specific interfaces will split this contract:
 *     ITicketClientActions, ITicketWorkerActions, ITicketAdminActions.
 *     Hooks and components will depend on the role-specific interface, never on ITicketService.
 *
 * OCP: new ticket operation = new method here + implementation in TicketService.
 *     Existing role interfaces are only extended, never modified.
 */

// ─── Shared enums ────────────────────────────────────────────────────────────

export type TicketEstado =
  | 'Nuevo'
  | 'EnProceso'
  | 'EnEspera'
  | 'Resuelto'
  | 'Cerrado'

export type TicketPrioridad = 'Baja' | 'Media' | 'Alta' | 'Critica'

// ─── Shared data shapes ──────────────────────────────────────────────────────

export interface AttachmentMeta {
  id: string
  nombreArchivo: string
  url: string
  tamañoBytes: number
  mimeType: string
}

export interface TicketSummary {
  id: string
  numero: string            // format: T-YYYY-NNNN
  asunto: string
  estado: TicketEstado
  prioridad: TicketPrioridad
  servicioNombre: string
  creadoEn: string          // ISO 8601
}

export interface TicketEvent {
  id: string
  tipoEvento: string
  estadoAnterior: TicketEstado | null
  estadoNuevo: TicketEstado | null
  comentario: string
  autorNombre: string
  creadoEn: string
}

export interface TicketDetail extends TicketSummary {
  descripcion: string
  clienteNombre: string
  asignadoNombre: string | null
  adjuntos: AttachmentMeta[]
  eventos: TicketEvent[]
  actualizadoEn: string
}

export interface TicketCreatePayload {
  asunto: string            // max 80 chars
  descripcion: string       // min 10 chars
  servicioId: string
  prioridad: TicketPrioridad
  adjuntos?: File[]         // validated by FileValidator (S13) before upload
}

export interface TicketFilterOptions {
  estado?: TicketEstado
  prioridad?: TicketPrioridad
  fechaDesde?: string
  fechaHasta?: string
  servicioId?: string
  clienteId?: string
  asignadoId?: string
}

// ─── Service contract ─────────────────────────────────────────────────────────

export interface ITicketService {
  // ── HU-06: Creación (cliente) ──────────────────────────────────────────────

  /** Create a new ticket. Handles file upload via IStorageService internally. */
  createTicket(payload: TicketCreatePayload): Promise<TicketDetail>

  // ── Lectura (cliente) ──────────────────────────────────────────────────────

  /** Return all tickets belonging to the authenticated client. */
  getMyTickets(filters?: TicketFilterOptions): Promise<TicketSummary[]>

  /** Return full detail of one ticket. Throws TicketNotFound if no access. */
  getTicketDetail(id: string): Promise<TicketDetail>

  // ── Gestión de estado (worker) — contratos para Sprint 3 ──────────────────

  /** Transition ticket to a new state. Requires non-empty comment (BR-35). */
  updateStatus(id: string, newStatus: TicketEstado, comment: string): Promise<TicketDetail>

  /** Add a comment without changing state. */
  addComment(id: string, comment: string): Promise<TicketEvent>

  /** Set the ticket to Cerrado. It may be reopened later. Requires a comment. */
  closeTicket(id: string, comment: string): Promise<TicketDetail>

  // ── Administración (admin) — contratos para Sprint 4 ──────────────────────

  /** Assign a Nuevo ticket to a worker (transitions to EnProceso). */
  assignTicket(id: string, workerId: string): Promise<TicketDetail>

  /** Reassign a ticket without changing its current operational state. */
  reassignTicket(id: string, newWorkerId: string): Promise<TicketDetail>

  /** Return all tickets in the system (admin view). */
  getAllTickets(filters?: TicketFilterOptions & { clienteId?: string; asignadoId?: string }): Promise<TicketSummary[]>
}
