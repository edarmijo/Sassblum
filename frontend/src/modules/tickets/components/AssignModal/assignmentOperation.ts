import type { ITicketAdminActions } from '../../interfaces/ITicketAdminActions'
import type { TicketEstado } from '../../interfaces/ITicketService'
import type { TicketDetail } from '../../interfaces/ITicketService'

export type AssignmentMode = 'assign' | 'reassign'

type AssignmentService = Pick<ITicketAdminActions, 'assignTicket' | 'reassignTicket'>

/** Nuevo is the only state that represents an initial assignment. */
export function getAssignmentMode(estado: TicketEstado): AssignmentMode {
  return estado === 'Nuevo' ? 'assign' : 'reassign'
}

/** Dispatch assignment without coupling the modal to endpoint details. */
export function executeAssignment(
  service: AssignmentService,
  mode: AssignmentMode,
  ticketId: string,
  workerId: string,
): Promise<TicketDetail> {
  return mode === 'reassign'
    ? service.reassignTicket(ticketId, workerId)
    : service.assignTicket(ticketId, workerId)
}
