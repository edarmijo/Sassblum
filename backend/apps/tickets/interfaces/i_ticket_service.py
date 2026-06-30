"""
Root ABC for all ticket operations in the backend.

Responsibility (SRP): declare the complete ticket operation contract.
    No HTTP logic, no ORM queries, no state machine calls — only method signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: DIP anchor — TicketService (Singleton) implements this in S12.
SOLID: DIP · OCP · LSP

Sprint coverage:
    S12 → this file (contract) + IStorageService (ISP split)
    S15 → ITicketClientActions, ITicketWorkerActions, ITicketAdminActions (ISP split from this)
    S12 exercises create_ticket() only; remaining methods are contracts for Sprints 3 & 4.

ISP note (S15):
    S15 will define three ISP interfaces that each expose a subset of this contract.
    TicketService implements all three. Views depend on the role-specific interface, not
    on ITicketService directly — that keeps each view minimal (ISP + DIP).

OCP extension:
    New ticket operation (e.g. reopen_ticket) = new @abstractmethod here + implementation
    in TicketService + new entry in the relevant ISP interface. Existing views unchanged.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketService(ABC):
    """Abstract contract for all ticket use cases across all roles."""

    # ── HU-06: Creación (cliente) ─────────────────────────────────────────────

    @abstractmethod
    def create_ticket(self, data: dict, user) -> dict:
        """
        Create a new ticket for an authenticated client.

        Business rules enforced by the concrete implementation (NOT here):
        - Generates unique ticket number T-YYYY-NNNN (generate_ticket_number).
        - Sets estado = 'Nuevo' and cliente = user.
        - Persists Attachment records for each uploaded file via IStorageService.
        - Creates the first TicketEvent (tipo='creacion').

        Args:
            data: validated dict from TicketCreateSerializer
                  (asunto, descripcion, servicio_id, prioridad, adjuntos: list)
            user: the authenticated User instance (CLIENTE role)

        Returns:
            TicketDetail dict with numero, asunto, estado, prioridad, creadoEn.

        Raises:
            ServiceNotFound  — servicio_id does not exist or is inactive
            ValidationError  — business rule violation (BusinessRuleValidator)
        """
        ...

    @abstractmethod
    def generate_ticket_number(self, year: int) -> str:
        """
        Generate the next unique ticket number in format T-YYYY-NNNN.
        Separated for SRP: the Ticket model never contains this logic.

        Args:
            year: the 4-digit calendar year (e.g. 2026)

        Returns:
            str — e.g. 'T-2026-0001', 'T-2026-0042'
        """
        ...

    # ── Lectura (cliente) ─────────────────────────────────────────────────────

    @abstractmethod
    def get_ticket_by_id(self, ticket_id: int, user) -> dict:
        """
        Return full detail of a single ticket.
        Enforces ownership: a CLIENTE only sees their own tickets.

        Returns:
            TicketDetail dict.

        Raises:
            TicketNotFound — ticket does not exist or caller lacks access.
        """
        ...

    @abstractmethod
    def get_my_tickets(self, user, filters: dict | None = None) -> list:
        """
        Return all tickets belonging to the authenticated client.
        Optional filters: {'estado': str, 'prioridad': str, 'fecha_desde': str, 'fecha_hasta': str}
        Returns: list of TicketSummary dicts, ordered by created_at desc.
        """
        ...

    # ── Gestión de estado (worker) — contratos para Sprint 3 ─────────────────

    @abstractmethod
    def update_status(self, ticket_id: int, new_status: str, comment: str, user) -> dict:
        """
        Transition a ticket to a new state via TicketStateMachine.
        BR-35: comment must be non-empty.
        Creates a TicketEvent and dispatches notification (Observer).

        Raises:
            TicketNotFound, InvalidTransitionError, CommentRequiredError.
        """
        ...

    @abstractmethod
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        """
        Add a comment to a ticket without changing its state.
        Creates a TicketEvent with tipo='comentario'.
        """
        ...

    @abstractmethod
    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        """
        Transition ticket from 'Resuelto' → 'Cerrado' (terminal state).
        BR-35: comment required.
        Raises: InvalidTransitionError if current state is not 'Resuelto'.
        """
        ...

    # ── Administración (admin) — contratos para Sprint 4 ─────────────────────

    @abstractmethod
    def assign_ticket(self, ticket_id: int, worker_id: int, user) -> dict:
        """
        Assign a 'Nuevo' ticket to a worker, transitioning it to 'EnProceso'.
        Raises: TicketNotFound, InvalidTransitionError if not in 'Nuevo' state.
        """
        ...

    @abstractmethod
    def reassign_ticket(self, ticket_id: int, new_worker_id: int, user) -> dict:
        """
        Reassign an 'EnProceso' ticket to a different worker.
        Creates a TicketEvent with tipo='reasignacion'.
        """
        ...

    @abstractmethod
    def get_all_tickets(self, filters: dict | None = None) -> list:
        """
        Return all tickets in the system (admin view).
        Optional filters: {'estado', 'prioridad', 'cliente_id', 'asignado_id',
                           'fecha_desde', 'fecha_hasta', 'servicio_id'}
        Returns: paginated list of TicketSummary dicts.
        """
        ...
