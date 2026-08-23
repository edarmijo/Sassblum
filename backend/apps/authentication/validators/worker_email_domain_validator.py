"""Validate the corporate domain required for worker accounts (B10)."""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class WorkerEmailDomainValidator(BaseValidator):
    """SRP: enforce one configured email domain for worker creation."""

    def __init__(self, domain: str) -> None:
        super().__init__()
        normalized_domain = domain.strip().lower()
        if not normalized_domain:
            raise ValueError("El dominio corporativo no puede estar vacío.")
        self._domain = normalized_domain

    def validate(self, data: dict) -> ValidationResult:
        if data.get("role", "worker") != "worker":
            return ValidationResult(is_valid=True)

        email = str(data.get("email", "")).strip().lower()
        local_part, separator, domain = email.rpartition("@")
        has_invalid_format = (
            email.count("@") != 1
            or any(character.isspace() for character in email)
        )
        if (
            has_invalid_format
            or not local_part
            or separator != "@"
            or domain != self._domain
        ):
            return ValidationResult(
                is_valid=False,
                errors=[
                    "El correo del trabajador debe pertenecer al dominio "
                    "corporativo autorizado."
                ],
                field_name="email",
            )
        return ValidationResult(is_valid=True)
