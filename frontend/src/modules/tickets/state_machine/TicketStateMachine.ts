/**
 * Ticket lifecycle state machine — encapsulates all valid transitions (Strategy pattern).
 *
 * Responsibility (SRP): know which transitions are valid and enforce BR-35 (comment required).
 *     No API calls, no state management, no notification logic — pure domain rules.
 * Depends on: TicketEstado type from ITicketService.ts — nothing else.
 * Pattern: Strategy — TRANSITIONS map is a named policy; the whole object is injectable.
 * SOLID: DIP · OCP · LSP · SRP
 *
 * OCP extension (Sprint 4 — state 'Reabierto'):
 *   TRANSITIONS['Cerrado'] = ['Reabierto']
 *   TRANSITIONS['Reabierto'] = ['EnProceso']
 *   → existing transitions are NEVER modified, only new keys are added.
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
   * Value = array of reachable states (empty array = terminal state)
   */
  static readonly TRANSITIONS: Record<TicketEstado, TicketEstado[]> = {
    Nuevo:     ['EnProceso'],
    EnProceso: ['EnEspera', 'Resuelto'],
    EnEspera:  ['EnProceso'],
    Resuelto:  ['Cerrado'],
    Cerrado:   [],
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

  /** Return true if the state has no outgoing transitions (i.e. Cerrado). */
  isTerminal(state: TicketEstado): boolean {
    return TicketStateMachine.TRANSITIONS[state]?.length === 0
  }
}
