"""
ISP interface — ticket operations available to an ADMIN user.

Responsibility (SRP): expose only the actions an ADMINISTRADOR can perform on tickets.
    An admin assigns, reassigns, corrects contact snapshots, and has a global view.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — assignment and admin-list views depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT inheriting from ITicketWorkerActions or ITicketClientActions:
    An admin does not create tickets on behalf of clients (different flow).
    Merging interfaces would expose methods that admin views never call (ISP violation).

Relation to ITicketService:
    TicketService implements ITicketAdminActions alongside the other two role interfaces.
    Admin views receive ITicketAdminActions via constructor (DIP).

OCP extension:
    New admin action (e.g. bulk_assign, escalate) = new @abstractmethod here.
    ITicketClientActions and ITicketWorkerActions are NEVER modified.

Sprint usage:
    S15 → this file (contract — Sprint 4 exercises these methods)
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.authentication.models import User


class ITicketAdminActions(ABC):
    """Operations an ADMINISTRADOR user can perform on tickets."""

    @abstractmethod
    def assign_ticket(self, ticket_id: int, worker_id: int, user: User) -> dict:
        """
        HU-05: Assign a ticket with no worker. Nuevo transitions to EnProceso;
        a legacy ticket preserves its imported operational state.
        Validates: worker must be active (estado=ACTIVO) and have role=WORKER.
        Creates a TicketEvent and triggers the Observer.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError (unsupported current ticket state).
        """
        ...

    @abstractmethod
    def reassign_ticket(
        self,
        ticket_id: int,
        new_worker_id: int,
        user: User,
    ) -> dict:
        """
        HU-08: Reassign a ticket without changing its current operational state.
        Creates a TicketEvent with tipo='reasignacion'.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound or validation errors for an invalid worker.
        """
        ...

    @abstractmethod
    def update_contact(self, ticket_id: int, data: dict, user: User) -> dict:
        """Correct the per-ticket contact snapshot without changing the user account."""
        ...

    @abstractmethod
    def get_all_tickets(self, filters: dict | None = None) -> list:
        """
        HU-10 (admin): Global ticket list with full filter support.
        Optional filters: estado, prioridad, cliente_id, asignado_id,
                          fecha_desde, fecha_hasta, servicio_id, page, page_size.
        Returns: paginated list of TicketSummary dicts.
        """
        ...
