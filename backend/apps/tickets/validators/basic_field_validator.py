"""
Chain of Responsibility node — validates basic text fields of a ticket.

Responsibility (SRP): enforce only character-count rules on asunto and descripcion.
Depends on: BaseValidator (core/base/base_validator.py).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · LSP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class BasicFieldValidator(BaseValidator):
    """Validates asunto (≤80 chars) and descripcion (≥10 chars)."""

    ASUNTO_MAX = 80
    DESCRIPCION_MIN = 10

    def validate(self, data: dict) -> ValidationResult:
        asunto = data.get("asunto", "")
        if not asunto or len(asunto) > self.ASUNTO_MAX:
            return ValidationResult(
                is_valid=False,
                errors=[f"El asunto debe tener entre 1 y {self.ASUNTO_MAX} caracteres."],
                field_name="asunto",
            )

        descripcion = data.get("descripcion", "")
        if not descripcion or len(descripcion) < self.DESCRIPCION_MIN:
            return ValidationResult(
                is_valid=False,
                errors=[
                    f"La descripción debe tener al menos {self.DESCRIPCION_MIN} caracteres."
                ],
                field_name="descripcion",
            )

        return ValidationResult(is_valid=True)
