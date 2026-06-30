"""
ISP interface — ticket operations available to a WORKER user.

Responsibility (SRP): expose only the actions a TRABAJADOR can perform on tickets.
    A worker updates status, adds comments, and closes assigned tickets. Nothing more.
Depends on: abc.ABC — nothing from the domain.
Pattern: ISP — status update and comment views depend on this, never on ITicketService.
SOLID: ISP · DIP · OCP · LSP

Why NOT inheriting from ITicketClientActions:
    A worker has fundamentally different actions from a client. Merging would force
    worker views to declare methods they never call, and tests to cover irrelevant paths.

Relation to ITicketService:
    TicketService implements ITicketWorkerActions alongside ITicketClientActions.
    Worker views receive ITicketWorkerActions via constructor (DIP).

OCP extension:
    New worker action (e.g. request_info) = new @abstractmethod here.
    ITicketClientActions and ITicketAdminActions are NEVER modified.

Sprint usage:
    S15 → this file (contract — Sprint 3 exercises these methods)
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class ITicketWorkerActions(ABC):
    """Operations a TRABAJADOR user can perform on assigned tickets."""

    @abstractmethod
    def update_status(
        self, ticket_id: int, new_status: str, comment: str, user
    ) -> dict:
        """
        HU-07: Transition a ticket to a new state via TicketStateMachine.
        BR-35: comment must be non-empty.
        Creates a TicketEvent and triggers the Observer (NotificationService).
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError, CommentRequiredError.
        """
        ...

    @abstractmethod
    def add_comment(self, ticket_id: int, comment: str, user) -> dict:
        """
        HU-11: Add a comment to a ticket without changing its state.
        Creates a TicketEvent with tipo='comentario'.
        Returns: the new TicketEvent dict.
        Raises: TicketNotFound, ValidationError (empty comment).
        """
        ...

    @abstractmethod
    def close_ticket(self, ticket_id: int, comment: str, user) -> dict:
        """
        HU-12: Transition Resuelto → Cerrado (terminal state).
        BR-35: comment required.
        Returns: updated TicketDetail dict.
        Raises: TicketNotFound, InvalidTransitionError (if not in Resuelto state).
        """
        ...
