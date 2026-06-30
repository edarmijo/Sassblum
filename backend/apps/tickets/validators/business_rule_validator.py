"""
Chain of Responsibility node — validates business rules for ticket creation.

Responsibility (SRP): enforce domain-level business rules only.
Depends on: BaseValidator (core/base/base_validator.py).
    Receives ticket_repository via __init__ for duplicate check (DIP).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · DIP · LSP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult

# Business hours: Monday–Friday 07:00–20:00 local time
_BUSINESS_START = 7
_BUSINESS_END = 20
_BUSINESS_DAYS = {0, 1, 2, 3, 4}  # Mon=0 … Fri=4


class BusinessRuleValidator(BaseValidator):
    """Validates business-hour constraint and duplicate-ticket rule."""

    def __init__(self, ticket_repository) -> None:
        super().__init__()
        self._ticket_repository = ticket_repository

    def validate(self, data: dict) -> ValidationResult:
        # ── Rule 1: business hours (INFORMATIONAL, not blocking) ──────────
        # Tickets can be created 24/7. If outside business hours, the response
        # includes a warning but the ticket IS created.
        # This is handled at the view layer, not here (H#6 from audit).

        # ── Rule 2: no active duplicate for same client + service + subject ─
        cliente_id = data.get("cliente_id")
        asunto = data.get("asunto", "")
        servicio_id = data.get("servicio_id")

        if cliente_id and asunto and servicio_id:
            duplicate = self._ticket_repository.find_active_duplicate(
                cliente_id=cliente_id,
                asunto=asunto,
                servicio_id=servicio_id,
            )
            if duplicate:
                return ValidationResult(
                    is_valid=False,
                    errors=["Ya existe un ticket activo con el mismo asunto y servicio."],
                    field_name="duplicado",
                )

        return ValidationResult(is_valid=True)
