"""
Abstract base node for the Chain of Responsibility pattern used across all
validation layers: authentication (Sprint 1), ticket creation (Sprint 2),
report generation (Sprint 4).

Responsibility (SRP): define the node structure and chain traversal logic.
    Each concrete subclass implements exactly ONE validation rule in validate().
Depends on: abc — nothing from the domain.
Pattern: Chain of Responsibility
SOLID: OCP · SRP (one rule per node) · LSP (every node is substitutable)

How to extend (OCP):
    1. Create CriticalPriorityValidator(BaseValidator) in Sprint 4
    2. Implement validate() with only that priority rule
    3. Add to chain: field_v.add_validator(file_v).add_validator(priority_v)
    → BasicFieldValidator and FileValidator are NEVER modified.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    """Value object returned by every validator node."""

    is_valid: bool
    # User-facing messages suitable for DRF error responses
    errors: list[str] = field(default_factory=list)
    # The model/serializer field that failed (e.g. 'email', 'password', 'asunto')
    field_name: str = ""


class BaseValidator(ABC):
    """
    Abstract chain node. Subclasses implement validate(); run_chain() handles traversal.

    Do NOT override run_chain() in concrete subclasses — doing so breaks LSP and makes
    the chain behavior unpredictable.
    """

    def __init__(self) -> None:
        self._next: BaseValidator | None = None

    def add_validator(self, validator: BaseValidator) -> BaseValidator:
        """
        Append a validator node at the end of this chain.
        Returns the added node to allow fluent chaining:
            email_v.add_validator(password_v).add_validator(phone_v)
        """
        self._next = validator
        return validator

    @abstractmethod
    def validate(self, data: dict) -> ValidationResult:
        """
        Implement exactly ONE validation rule here.
        Must NOT call self._next — chain traversal is the responsibility of run_chain().

        Args:
            data: The raw deserialized data from the DRF serializer.

        Returns:
            ValidationResult with is_valid=True on pass, errors populated on fail.
        """
        ...

    def run_chain(self, data: dict) -> ValidationResult:
        """
        Run this node's rule. If it passes, delegate to the next node.
        Stop and return immediately on the first failure.

        This is the public entry point when running the full chain from any node.
        """
        result = self.validate(data)
        if not result.is_valid or self._next is None:
            return result
        return self._next.run_chain(data)
