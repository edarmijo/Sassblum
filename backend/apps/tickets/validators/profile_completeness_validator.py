"""Ticket validator that requires a complete client profile."""

from __future__ import annotations

from collections.abc import Sequence

from core.base.base_validator import BaseValidator, ValidationResult


class ProfileCompletenessValidator(BaseValidator):
    """Block ticket creation until identification and company are complete."""

    MESSAGE = (
        "Completa tu tipo y número de identificación y tu empresa en el perfil "
        "antes de crear un ticket."
    )

    def __init__(self, validators: Sequence[BaseValidator]) -> None:
        super().__init__()
        self._profile_validators = tuple(validators)

    def validate(self, data: dict) -> ValidationResult:
        for validator in self._profile_validators:
            if not validator.validate(data).is_valid:
                return ValidationResult(
                    is_valid=False,
                    errors=[self.MESSAGE],
                    field_name="perfil",
                )
        return ValidationResult(is_valid=True)
