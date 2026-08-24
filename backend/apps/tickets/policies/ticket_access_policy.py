"""Role-aware ticket access policy with separate read and write decisions."""

from __future__ import annotations

from django.db.models import Q

from apps.authentication.models import User
from apps.tickets.interfaces.i_ticket_access_policy import ITicketAccessPolicy
from apps.tickets.models import Ticket


class TicketAccessPolicy(ITicketAccessPolicy):
    """Authorize current assignments without losing verified legacy relationships."""

    def visibility_filter(self, user: User) -> Q:
        role = getattr(user, "role", None)
        if role == "admin":
            return Q()
        if role == "worker":
            return Q(asignado=user) | Q(
                legacy_codigo__isnull=False,
                cliente=user,
            )
        if role == "client":
            return Q(cliente=user)
        return Q(pk__in=[])

    def can_read(self, ticket: Ticket, user: User) -> bool:
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        if role == "worker":
            return (
                ticket.asignado_id == user.id
                or self._is_legacy_contact(ticket, user)
            )
        if role == "client":
            return ticket.cliente_id == user.id
        return False

    def can_modify(self, ticket: Ticket, user: User) -> bool:
        role = getattr(user, "role", None)
        if role == "admin":
            return True
        if role == "worker":
            return ticket.asignado_id == user.id
        if role == "client":
            return ticket.cliente_id == user.id
        return False

    @staticmethod
    def _is_legacy_contact(ticket: Ticket, user: User) -> bool:
        return ticket.legacy_codigo is not None and ticket.cliente_id == user.id
