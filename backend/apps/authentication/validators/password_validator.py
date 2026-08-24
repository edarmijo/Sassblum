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
        has_letter = any(character.isalpha() for character in password)
        has_ascii_digit = any(character in "0123456789" for character in password)
        if not has_letter or not has_ascii_digit:
            return ValidationResult(
                is_valid=False,
                errors=["La contraseña debe incluir al menos una letra y un número."],
                field_name="password",
            )
        return ValidationResult(is_valid=True)
