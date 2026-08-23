"""
NameValidator — Chain of Responsibility node validating name presence (SRP).
Extends BaseValidator (S1). Pattern: Chain of Responsibility. SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class NameValidator(BaseValidator):
    def validate(self, data: dict) -> ValidationResult:
        nombre = (data.get("nombre") or "").strip()
        if not nombre:
            return ValidationResult(
                is_valid=False,
                errors=["El nombre es obligatorio."],
                field_name="nombre",
            )
        return ValidationResult(is_valid=True)
