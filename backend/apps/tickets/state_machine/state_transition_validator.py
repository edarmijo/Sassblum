"""
Chain of Responsibility node — validates ticket state transitions.

Responsibility (SRP): delegate transition validity to TicketStateMachine.
    Does not contain transition rules — it only calls the machine and maps the result
    to a ValidationResult consumable by the rest of the chain.
Depends on: BaseValidator (core/base/base_validator.py)
            TicketStateMachine — injected via constructor (DIP).
Pattern: Chain of Responsibility node + DIP (machine is injected, not instantiated here).
SOLID: SRP · DIP · LSP · OCP

DIP note:
    TicketService creates TicketStateMachine() and passes it here.
    Tests can inject a stub or a machine with a reduced TRANSITIONS map without
    touching this class (LSP).

OCP:
    New transition rule → update TRANSITIONS in TicketStateMachine.
    This validator never changes.

Sprint usage:
    S14 → this file (full signature + delegation logic)
    The validator is wired into the update-status flow in Sprint 3 (S24).
    S18 → covered indirectly via test_state_machine.py + test_validators.py
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult
from .ticket_state_machine import TicketStateMachine


class StateTransitionValidator(BaseValidator):
    """
    Validates that a requested state transition is permitted by TicketStateMachine.
    Used in the update-status flow (Sprint 3); wired into the chain by ValidatorFactory.
    """

    def __init__(self, state_machine: TicketStateMachine) -> None:
        """
        Args:
            state_machine: the TicketStateMachine instance (injected — DIP).
        """
        super().__init__()
        self._machine = state_machine

    def validate(self, data: dict) -> ValidationResult:
        """
        Check that data['estado_actual'] → data['estado_nuevo'] is a valid transition.
        BR-35 (comment required) is enforced by TicketStateMachine.transition() at
        service level; here we only check can_transition() for chain compatibility.

        Args:
            data: dict containing:
                  'estado_actual' (str) — current ticket state
                  'estado_nuevo'  (str) — requested target state

        Returns:
            ValidationResult(is_valid=True) if the transition is allowed.
            ValidationResult(is_valid=False, field_name='estado', errors=[msg]) if not.
        """
        from_state = data.get("estado_actual", "")
        to_state   = data.get("estado_nuevo", "")

        if self._machine.can_transition(from_state, to_state):
            return ValidationResult(is_valid=True, field_name="estado")

        return ValidationResult(
            is_valid=False,
            errors=[
                f"Transición '{from_state}' → '{to_state}' no está permitida. "
                f"Estados válidos desde '{from_state}': "
                f"{self._machine.TRANSITIONS.get(from_state, [])}."
            ],
            field_name="estado",
        )
