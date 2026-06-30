/**
 * ISP interface — ticket operations available to a WORKER user.
 *
 * Responsibility (SRP): expose only what a TRABAJADOR needs from tickets.
 *     A worker updates status, comments, and closes assigned tickets. Nothing else.
 * Depends on: TicketEstado, TicketDetail, TicketEvent from ITicketService.ts.
 * Pattern: ISP — useTickets hook (worker context) depends on this, never on ITicketService.
 * SOLID: ISP · DIP · OCP · LSP
 *
 * Why NOT extending ITicketClientActions:
 *     A worker does not create tickets on behalf of clients via the same flow.
 *     Merging would expose createTicket() to worker components that never call it.
 *
 * OCP: new worker action (e.g. requestInfo) = new method here. Client and Admin unchanged.
 *
 * Sprint usage:
 *   S15 → this file (contract — Sprint 3 exercises these methods)
 */

import type { TicketEstado, TicketDetail, TicketEvent } from './ITicketService'

export interface ITicketWorkerActions {
  /**
   * HU-07: Transition ticket to a new state. Requires non-empty comment (BR-35).
   * Internally delegates to TicketStateMachine.
   */
  updateStatus(id: string, newStatus: TicketEstado, comment: string): Promise<TicketDetail>

  /** HU-11: Add a comment without changing state. Returns the new TicketEvent. */
  addComment(id: string, comment: string): Promise<TicketEvent>

  /** HU-12: Transition Resuelto → Cerrado (terminal). Requires comment (BR-35). */
  closeTicket(id: string, comment: string): Promise<TicketDetail>
}
