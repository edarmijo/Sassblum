"""
Façade over the ticket creation validator chain built by ValidatorFactory.

Responsibility (SRP): expose a single run(data) entry point.
    Does not know which nodes exist or in what order — ValidatorFactory decides.
Depends on: ValidatorFactory (core/factories/validator_factory.py) — DIP.
Pattern: Chain of Responsibility façade + Factory.
SOLID: SRP · DIP · OCP
"""

from __future__ import annotations

from core.base.base_validator import ValidationResult
from core.factories import ValidatorFactory


class TicketValidatorChain:
    """
    Façade over the validator chain. TicketService calls run(data);
    it never knows which nodes are in the chain.
    """

    def __init__(self, ticket_repository) -> None:
        self._root = ValidatorFactory.build_ticket_chain(ticket_repository)

    def run(self, data: dict) -> ValidationResult:
        """
        Execute the full chain from the root node (fail-fast).

        Args:
            data: validated dict from TicketCreateSerializer with
                  asunto, descripcion, servicio_id, adjuntos, cliente_id.
        """
        return self._root.run_chain(data)
