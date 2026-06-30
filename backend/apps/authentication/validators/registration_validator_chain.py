"""
RegistrationValidatorChain — assembles Email → Password (Chain of Responsibility).

Responsibility (SRP): wire the registration validator chain and expose run().
Pattern: Chain of Responsibility (assembler).
SOLID: OCP (add PhoneValidator = one addValidator, existing nodes untouched) · DIP.
"""

from __future__ import annotations

from core.base.base_validator import ValidationResult
from .email_validator import EmailValidator
from .password_validator import PasswordValidator


class RegistrationValidatorChain:
    def __init__(self) -> None:
        email_v = EmailValidator()
        email_v.add_validator(PasswordValidator())
        self._root = email_v

    def run(self, data: dict) -> ValidationResult:
        return self._root.run_chain(data)
