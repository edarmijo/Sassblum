/**
 * ISP interface — ticket operations available to an ADMIN user.
 *
 * Responsibility (SRP): expose only what an ADMINISTRADOR needs from tickets.
 *     An admin assigns, reassigns, and has a global view. Nothing from client/worker scope.
 * Depends on: TicketSummary, TicketDetail, TicketFilterOptions from ITicketService.ts.
 * Pattern: ISP — admin components depend on this, never on ITicketService.
 * SOLID: ISP · DIP · OCP · LSP
 *
 * Why NOT extending ITicketWorkerActions or ITicketClientActions:
 *     An admin manages assignment — entirely different semantics from status updates or creation.
 *     Merging would expose irrelevant methods to admin views (ISP violation).
 *
 * OCP: new admin action (e.g. bulkAssign) = new method here. Client and Worker unchanged.
 *
 * Sprint usage:
 *   S15 → this file (contract — Sprint 4 exercises these methods)
 */

import type { TicketSummary, TicketDetail, TicketFilterOptions } from './ITicketService'

export interface ITicketAdminActions {
  /**
   * HU-05: Assign a Nuevo ticket to a worker (transitions it to EnProceso).
   * @param workerId - ID of the TRABAJADOR to assign
   */
  assignTicket(id: string, workerId: string): Promise<TicketDetail>

  /**
   * HU-08: Reassign an EnProceso ticket to a different worker.
   * @param newWorkerId - ID of the new TRABAJADOR
   */
  reassignTicket(id: string, newWorkerId: string): Promise<TicketDetail>

  /**
   * HU-10 (admin): Global ticket list with extended filters.
   * Supports all TicketFilterOptions plus clienteId and asignadoId.
   */
  getAllTickets(
    filters?: TicketFilterOptions & { clienteId?: string; asignadoId?: string }
  ): Promise<TicketSummary[]>
}
