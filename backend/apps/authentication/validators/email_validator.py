"""
EmailValidator — Chain of Responsibility node validating email format (SRP).
Extends BaseValidator (S1). Pattern: Chain of Responsibility. SOLID: SRP·OCP·LSP.
"""

from __future__ import annotations

import re

from core.base.base_validator import BaseValidator, ValidationResult

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EmailValidator(BaseValidator):
    def validate(self, data: dict) -> ValidationResult:
        email = (data.get("email") or "").strip()
        if not _EMAIL_RE.match(email):
            return ValidationResult(
                is_valid=False,
                errors=["El correo electrónico no tiene un formato válido."],
                field_name="email",
            )
        return ValidationResult(is_valid=True)
