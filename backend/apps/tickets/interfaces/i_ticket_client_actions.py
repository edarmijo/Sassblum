"""
ISP interface — ticket operations available to a CLIENT user.

Responsibility (SRP): expose only the actions a CLIENTE can perform on tickets.
    A client creates tickets and reads their own. Nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — ticket_create_view and ticket_list_view depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT a subset of ITicketService via inheritance:
    If ITicketService grows with internal or admin methods, inheriting here would force
    client views to know about them (ISP violation). This interface is intentionally minimal.

Relation to ITicketService:
    TicketService implements BOTH ITicketService (full contract) AND ITicketClientActions.
    Views always depend on the role interface (DIP + ISP), never on ITicketService directly.

OCP extension:
    New client action (e.g. reopen_ticket) = new @abstractmethod here.
    ITicketWorkerActions and ITicketAdminActions are NEVER modified.

Sprint usage:
    S15 → this file (contract)
    S12 → ticket_create_view uses this
    S18 → tests verify IsClient permission + isolation from worker/admin actions
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketClientActions(ABC):
    """Operations a CLIENTE user can perform on tickets."""

    @abstractmethod
    def create_ticket(self, data: dict, user) -> dict:
        """
        HU-06: Create a new support ticket.
        Generates T-YYYY-NNNN number, sets estado='Nuevo', persists attachments.
        Args:
            data: validated dict from TicketCreateSerializer
            user: authenticated User instance with role == CLIENTE
        Returns: TicketDetail dict.
        Raises: ServiceNotFound, ValidationError (field or business rule).
        """
        ...

    @abstractmethod
    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        """
        HU-10: List tickets belonging to this client.
        Optional filters: estado, prioridad, fecha_desde, fecha_hasta, servicio_id.
        Returns: list of TicketSummary dicts ordered by created_at desc.
        """
        ...

    @abstractmethod
    def get_ticket_detail(self, ticket_id: int, user) -> dict:
        """
        HU-06: Full detail of one ticket — enforces ownership (client sees only own tickets).
        Returns: TicketDetail dict including adjuntos and eventos.
        Raises: TicketNotFound if ticket does not exist or belongs to another client.
        """
        ...
