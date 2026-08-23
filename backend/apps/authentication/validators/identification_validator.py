"""Type-aware Ecuadorian identification validation for account data."""

from __future__ import annotations

from apps.authentication.models import User
from core.base.base_validator import BaseValidator, ValidationResult


class IdentificationValidator(BaseValidator):
    """Require exactly 13 RUC digits or 10 cédula digits."""

    LENGTH_BY_TYPE = {
        User.TipoIdentificacion.RUC: 13,
        User.TipoIdentificacion.CEDULA: 10,
    }

    def validate(self, data: dict) -> ValidationResult:
        identification_type = data.get(
            "tipo_identificacion", User.TipoIdentificacion.RUC
        )
        identification = data.get("ruc")

        if identification_type not in self.LENGTH_BY_TYPE:
            return ValidationResult(
                is_valid=False,
                errors=["Selecciona un tipo de identificación válido."],
                field_name="tipo_identificacion",
            )
        if not isinstance(identification, str) or not identification:
            return ValidationResult(
                is_valid=False,
                errors=["La identificación es obligatoria."],
                field_name="ruc",
            )
        if not identification.isascii() or not identification.isdigit():
            return ValidationResult(
                is_valid=False,
                errors=[
                    "La identificación debe contener solo dígitos, sin espacios ni guiones."
                ],
                field_name="ruc",
            )

        expected_length = self.LENGTH_BY_TYPE[identification_type]
        if len(identification) != expected_length:
            label = "El RUC" if identification_type == User.TipoIdentificacion.RUC else "La cédula"
            return ValidationResult(
                is_valid=False,
                errors=[f"{label} debe tener exactamente {expected_length} dígitos."],
                field_name="ruc",
            )
        return ValidationResult(is_valid=True)
