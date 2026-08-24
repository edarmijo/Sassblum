import type { ITicketAdminActions } from '../../interfaces/ITicketAdminActions'
import type { TicketDetail } from '../../interfaces/ITicketService'

export type AssignmentMode = 'assign' | 'reassign'

type AssignmentService = Pick<ITicketAdminActions, 'assignTicket' | 'reassignTicket'>

/** Assignment depends on whether a worker exists, not on the ticket state. */
export function getAssignmentMode(assignedWorkerName: string | null): AssignmentMode {
  return assignedWorkerName === null ? 'assign' : 'reassign'
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
