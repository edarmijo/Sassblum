"""Required company-name validation for client registration."""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class EmpresaValidator(BaseValidator):
    """Reject missing or whitespace-only company names."""

    def validate(self, data: dict) -> ValidationResult:
        empresa = data.get("empresa")
        if not isinstance(empresa, str) or not empresa.strip():
            return ValidationResult(
                is_valid=False,
                errors=["La empresa es obligatoria."],
                field_name="empresa",
            )
        return ValidationResult(is_valid=True)
