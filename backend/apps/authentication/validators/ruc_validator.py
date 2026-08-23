"""
RucValidator — Chain of Responsibility node validating RUC format and presence (SRP).
Policy: exactly 13 numeric digits (Ecuadorian RUC).
Extends BaseValidator (S1). Pattern: Chain of Responsibility. SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

import re

from core.base.base_validator import BaseValidator, ValidationResult

_RUC_RE = re.compile(r"^\d{13}$")


class RucValidator(BaseValidator):
    def validate(self, data: dict) -> ValidationResult:
        ruc = (data.get("ruc") or "").strip()
        if not ruc:
            return ValidationResult(
                is_valid=False,
                errors=["El RUC es obligatorio."],
                field_name="ruc",
            )
        if not _RUC_RE.match(ruc):
            return ValidationResult(
                is_valid=False,
                errors=["El RUC debe tener exactamente 13 dígitos numéricos."],
                field_name="ruc",
            )
        return ValidationResult(is_valid=True)
