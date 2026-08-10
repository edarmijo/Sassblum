/**
 * Ticket lifecycle state machine — encapsulates all valid transitions (Strategy pattern).
 *
 * Responsibility (SRP): know which transitions are valid and enforce BR-35 (comment required).
 *     No API calls, no state management, no notification logic — pure domain rules.
 * Depends on: TicketEstado type from ITicketService.ts — nothing else.
 * Pattern: Strategy — TRANSITIONS map is a named policy; the whole object is injectable.
 * SOLID: DIP · OCP · LSP · SRP
 *
 * Nuevo is reserved for the assignment flow. After assignment, workers and
 * administrators can move freely between the four operational states.
 *
 * Usage:
 *   const machine = new TicketStateMachine()
 *   if (machine.canTransition('EnProceso', 'Resuelto')) { ... }
 *   const next = machine.transition('EnProceso', 'Resuelto', 'Issue resolved')
 *
 * TicketStatusBadge (S17) reads TRANSITIONS to derive valid next states per role.
 */

import type { TicketEstado } from '../interfaces/ITicketService'

export class TicketStateMachine {
  /**
   * Transition map.
   * Key   = current state
   * Value = array of reachable states.
   */
  static readonly TRANSITIONS: Record<TicketEstado, TicketEstado[]> = {
    Nuevo:     ['EnProceso'],
    EnProceso: ['EnProceso', 'EnEspera', 'Resuelto', 'Cerrado'],
    EnEspera:  ['EnProceso', 'EnEspera', 'Resuelto', 'Cerrado'],
    Resuelto:  ['EnProceso', 'EnEspera', 'Resuelto', 'Cerrado'],
    Cerrado:   ['EnProceso', 'EnEspera', 'Resuelto', 'Cerrado'],
  }

  /**
   * Return true if fromState → toState exists in TRANSITIONS.
   * Does NOT enforce BR-35 — call transition() for the full check.
   */
  canTransition(fromState: TicketEstado, toState: TicketEstado): boolean {
    return TicketStateMachine.TRANSITIONS[fromState]?.includes(toState) ?? false
  }

  /**
   * Validate and return the new state after a transition.
   *
   * @param fromState - current ticket state
   * @param toState   - desired target state
   * @param comment   - mandatory explanation (BR-35)
   * @returns toState if transition is valid
   * @throws Error('INVALID_TRANSITION') if transition not in TRANSITIONS
   * @throws Error('COMMENT_REQUIRED')   if comment is blank (BR-35)
   */
  transition(
    fromState: TicketEstado,
    toState: TicketEstado,
    comment: string,
  ): TicketEstado {
    if (!this.canTransition(fromState, toState)) {
      throw new Error(
        `INVALID_TRANSITION: '${fromState}' → '${toState}' is not allowed.`,
      )
    }

    if (!comment?.trim()) {
      throw new Error(
        'COMMENT_REQUIRED: A non-empty comment is required for every state transition (BR-35).',
      )
    }

    return toState
  }

  /** Return all states that can be reached from the given state. */
  nextStates(fromState: TicketEstado): TicketEstado[] {
    return TicketStateMachine.TRANSITIONS[fromState] ?? []
  }

  /** Return true if a configured state has no outgoing transitions. */
  isTerminal(state: TicketEstado): boolean {
    return TicketStateMachine.TRANSITIONS[state]?.length === 0
  }
}
