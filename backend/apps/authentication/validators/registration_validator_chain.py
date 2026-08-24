"""
RegistrationValidatorChain — assembles required account validators.

Responsibility (SRP): wire the registration validator chain and expose run().
Pattern: Chain of Responsibility (assembler).
SOLID: OCP (add PhoneValidator = one addValidator, existing nodes untouched) · DIP.
"""

from __future__ import annotations

from core.base.base_validator import ValidationResult
from .empresa_validator import EmpresaValidator
from .identification_validator import IdentificationValidator
from .email_validator import EmailValidator
from .password_validator import PasswordValidator


class RegistrationValidatorChain:
    def __init__(self) -> None:
        empresa_v = EmpresaValidator()
        identification_v = IdentificationValidator()
        email_v = EmailValidator()
        empresa_v.add_validator(identification_v).add_validator(email_v).add_validator(
            PasswordValidator()
        )
        self._root = empresa_v

    def run(self, data: dict) -> ValidationResult:
        return self._root.run_chain(data)
