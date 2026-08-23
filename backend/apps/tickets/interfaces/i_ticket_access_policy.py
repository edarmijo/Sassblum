"""Access-policy contract for ticket visibility and write authorization."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from django.db.models import Q

if TYPE_CHECKING:
    from apps.authentication.models import User
    from apps.tickets.models import Ticket


class ITicketAccessPolicy(ABC):
    """Keep read and write rules explicit and independently testable (ISP/DIP)."""

    @abstractmethod
    def visibility_filter(self, user: User) -> Q:
        """Return the ORM predicate for tickets visible to ``user``."""
        ...

    @abstractmethod
    def can_read(self, ticket: Ticket, user: User) -> bool:
        """Return whether ``user`` may read the ticket and its history."""
        ...

    @abstractmethod
    def can_modify(self, ticket: Ticket, user: User) -> bool:
        """Return whether ``user`` may perform their role's write actions."""
        ...
