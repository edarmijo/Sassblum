"""Política única de contraseñas para registro, reset y cambio autenticado."""

from __future__ import annotations

from core.base.base_validator import BaseValidator

from apps.authentication.validators import PasswordValidator


class PasswordPolicyViolation(Exception):
    """La contraseña propuesta no cumple la política confirmada del proyecto."""


class PasswordPolicy:
    """Adapta la cadena de dominio a los casos que establecen una contraseña."""

    def __init__(self, validator: BaseValidator | None = None) -> None:
        self._validator = validator or PasswordValidator()

    def validate(self, password: str) -> None:
        """Exige ocho caracteres, al menos una letra y al menos un número."""
        result = self._validator.run_chain({"password": password})
        if not result.is_valid:
            raise PasswordPolicyViolation("; ".join(result.errors))
