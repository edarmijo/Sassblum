"""
PasswordValidator — Chain of Responsibility node validating password policy (SRP).
Policy: ≥8 chars, at least one letter and one digit.
Extends BaseValidator (S1). SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class PasswordValidator(BaseValidator):
    MIN_LENGTH = 8

    def validate(self, data: dict) -> ValidationResult:
        password = data.get("password") or ""
        if len(password) < self.MIN_LENGTH:
            return ValidationResult(
                is_valid=False,
                errors=[f"La contraseña debe tener al menos {self.MIN_LENGTH} caracteres."],
                field_name="password",
            )
        if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
            return ValidationResult(
                is_valid=False,
                errors=["La contraseña debe incluir al menos una letra y un número."],
                field_name="password",
            )
        return ValidationResult(is_valid=True)
