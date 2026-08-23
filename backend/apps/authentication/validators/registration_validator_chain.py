"""
RegistrationValidatorChain — assembles Name → Empresa → RUC → Email → Password (Chain of Responsibility).

Responsibility (SRP): wire the registration validator chain and expose run().
Pattern: Chain of Responsibility (assembler).
SOLID: OCP (add PhoneValidator = one addValidator, existing nodes untouched) · DIP.
"""

from __future__ import annotations

from core.base.base_validator import ValidationResult
from .email_validator import EmailValidator
from .empresa_validator import EmpresaValidator
from .name_validator import NameValidator
from .password_validator import PasswordValidator
from .ruc_validator import RucValidator


class RegistrationValidatorChain:
    def __init__(self) -> None:
        name_v = NameValidator()
        empresa_v = EmpresaValidator()
        ruc_v = RucValidator()
        email_v = EmailValidator()
        pass_v = PasswordValidator()

        name_v.add_validator(empresa_v).add_validator(ruc_v).add_validator(email_v).add_validator(pass_v)
        self._root = name_v

    def run(self, data: dict) -> ValidationResult:
        return self._root.run_chain(data)
