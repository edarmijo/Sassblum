"""
Factory for assembling validator chains — centralises node wiring (OCP).

Responsibility (SRP): know which validator nodes exist and in what order to chain them.
Depends on: concrete validator classes in apps/tickets/validators/ — DIP inversion point.
Pattern: Factory.
SOLID: OCP · SRP · DIP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator


class ValidatorFactory:
    """Creates and wires validator chains for each domain context."""

    @staticmethod
    def build_ticket_chain(ticket_repository) -> BaseValidator:
        """
        Assemble the ticket-creation chain: BasicField → File → Profile → BusinessRule.

        OCP: add CriticalPriorityValidator (Sprint 4) by appending one line:
            business_v.add_validator(CriticalPriorityValidator())
        Nothing else changes.
        """
        from apps.tickets.validators.basic_field_validator import BasicFieldValidator
        from apps.tickets.validators.file_validator import FileValidator
        from apps.tickets.validators.profile_completeness_validator import (
            ProfileCompletenessValidator,
        )
        from apps.tickets.validators.business_rule_validator import BusinessRuleValidator
        from apps.authentication.validators import EmpresaValidator, IdentificationValidator

        basic_field_v = BasicFieldValidator()
        file_v        = FileValidator()
        profile_v     = ProfileCompletenessValidator((
            IdentificationValidator(),
            EmpresaValidator(),
        ))
        business_v    = BusinessRuleValidator(ticket_repository)

        basic_field_v.add_validator(file_v).add_validator(profile_v).add_validator(business_v)
        return basic_field_v
