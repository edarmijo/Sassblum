"""
Ticket lifecycle state machine — encapsulates all valid transitions (Strategy pattern).

Responsibility (SRP): know which transitions are valid and enforce BR-35 (comment required).
    No ORM access, no HTTP logic, no notification dispatch — pure domain rules.
Depends on: core.exceptions.domain_exceptions — nothing from Django or DRF.
Pattern: Strategy — each entry in TRANSITIONS is a named rule; the set is replaceable.
SOLID: DIP · OCP · LSP · SRP

Why NOT an ABC:
    The machine is a concrete policy object, not a hierarchy. Tests swap it by injecting
    a different instance into StateTransitionValidator (DIP), not by subclassing.

OCP extension path:
    New state (e.g. 'Reabierto') in Sprint 4:
        TRANSITIONS['Cerrado'] = ['Reabierto']
        TRANSITIONS['Reabierto'] = ['EnProceso']
    Existing transition rules are NEVER modified — only new keys are added.

LSP:
    Any object that exposes can_transition() and transition() with the same contracts
    is substitutable here (e.g. a stub in tests).

Sprint usage:
    S14 → this file (contract + TRANSITIONS map)
    S14 → StateTransitionValidator consumes this via constructor (DIP)
    S18 → test_state_machine.py covers all valid/invalid transitions + BR-35
"""

from __future__ import annotations

from core.exceptions.domain_exceptions import (
    CommentRequiredError,
    InvalidTransitionError,
)


class TicketStateMachine:
    """
    Encapsulates the ticket lifecycle.

    States: Nuevo · EnProceso · EnEspera · Resuelto · Cerrado
    Terminal state: Cerrado (empty list → no outgoing transitions)
    """

    # ── Transition map ────────────────────────────────────────────────────────
    # Key   = current state
    # Value = list of reachable states (empty = terminal)
    #
    # Business rules encoded here:
    #   Nuevo     → EnProceso  (requires prior assignment — enforced in TicketService)
    #   EnProceso → EnEspera | Resuelto
    #   EnEspera  → EnProceso  (reactivated after client response)
    #   Resuelto  → Cerrado    (client or worker confirms resolution)
    #   Cerrado   → (none)     terminal — no further changes allowed
    TRANSITIONS: dict[str, list[str]] = {
        "Nuevo":     ["EnProceso"],
        "EnProceso": ["EnEspera", "Resuelto"],
        "EnEspera":  ["EnProceso"],
        "Resuelto":  ["Cerrado"],
        "Cerrado":   [],
    }

    # ── Public API ────────────────────────────────────────────────────────────

    def can_transition(self, from_state: str, to_state: str) -> bool:
        """
        Return True if the transition from_state → to_state is in TRANSITIONS.
        Does NOT enforce BR-35 — that is the responsibility of transition().

        Args:
            from_state: current ticket state string
            to_state:   desired target state string

        Returns:
            bool — True if allowed, False otherwise (including unknown states).
        """
        return to_state in self.TRANSITIONS.get(from_state, [])

    def transition(self, from_state: str, to_state: str, comment: str) -> str:
        """
        Validate and apply a state transition.

        Business rules enforced here:
            1. Transition must exist in TRANSITIONS (InvalidTransitionError).
            2. Comment must be non-empty after stripping whitespace (BR-35).

        Args:
            from_state: current ticket state
            to_state:   desired target state
            comment:    mandatory explanation for the transition (BR-35)

        Returns:
            str — the new state (same as to_state) if transition is valid.

        Raises:
            InvalidTransitionError — if the transition is not in TRANSITIONS.
            CommentRequiredError   — if comment is blank (BR-35).
        """
        if not self.can_transition(from_state, to_state):
            raise InvalidTransitionError(from_state, to_state)

        if not comment or not comment.strip():
            raise CommentRequiredError(
                "A non-empty comment is required for every state transition (BR-35)."
            )

        return to_state

    @classmethod
    def all_states(cls) -> list[str]:
        """Return all known states (keys of TRANSITIONS)."""
        return list(cls.TRANSITIONS.keys())

    @classmethod
    def is_terminal(cls, state: str) -> bool:
        """Return True if state has no outgoing transitions (i.e. Cerrado)."""
        return cls.TRANSITIONS.get(state, None) == []
