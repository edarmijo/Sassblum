/**
 * ISP interface — ticket operations available to a CLIENT user.
 *
 * Responsibility (SRP): expose only what a CLIENTE needs from tickets.
 *     A client creates tickets and reads their own. Nothing more.
 * Depends on: TicketCreatePayload, TicketSummary, TicketDetail, TicketFilterOptions
 *             from ITicketService.ts — shared types, no coupling to implementation.
 * Pattern: ISP — useTickets hook (client context) depends on this, never on ITicketService.
 * SOLID: ISP · DIP · OCP · LSP
 *
 * Why NOT a subset of ITicketService:
 *     If ITicketService grows with internal methods, this interface stays frozen.
 *     The client hook never sees admin or worker operations (ISP purity).
 *
 * OCP: new client action = new method here. Worker and Admin interfaces unchanged.
 *
 * Sprint usage:
 *   S15 → this file (contract)
 *   S17 → useTickets hook implements this context
 *   S17 → CreateTicketForm, TicketCard, TicketDetail consume via useTickets
 */

import type {
  TicketCreatePayload,
  TicketSummary,
  TicketDetail,
  TicketFilterOptions,
} from './ITicketService'

export interface ITicketClientActions {
  /** HU-06: Create a new support ticket (file upload handled by IStorageService). */
  createTicket(payload: TicketCreatePayload): Promise<TicketDetail>

  /** HU-10: List tickets belonging to the authenticated client. */
  getMyTickets(filters?: TicketFilterOptions): Promise<TicketSummary[]>

  /** HU-06: Full detail of one ticket. Throws if not owned by current user. */
  getTicketDetail(id: string): Promise<TicketDetail>
}
