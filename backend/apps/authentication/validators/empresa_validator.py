"""
EmpresaValidator — Chain of Responsibility node validating company name presence (SRP).
Extends BaseValidator (S1). Pattern: Chain of Responsibility. SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class EmpresaValidator(BaseValidator):
    def validate(self, data: dict) -> ValidationResult:
        empresa = (data.get("empresa") or "").strip()
        if not empresa:
            return ValidationResult(
                is_valid=False,
                errors=["El nombre de la empresa es obligatorio."],
                field_name="empresa",
            )
        return ValidationResult(is_valid=True)
