"""
RucValidator — Chain of Responsibility node validating the RUC field (SRP).
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult

RUC_LENGTH = 13


class RucValidator(BaseValidator):
    def validate(self, data: dict) -> ValidationResult:
        ruc = (data.get("ruc") or "").strip()
        if not ruc:
            return ValidationResult(
                is_valid=False,
                errors=["El RUC es obligatorio."],
                field_name="ruc",
            )
        if not (ruc.isdigit() and len(ruc) == RUC_LENGTH):
            return ValidationResult(
                is_valid=False,
                errors=["El RUC debe tener 13 dígitos numéricos."],
                field_name="ruc",
            )
        return ValidationResult(is_valid=True)