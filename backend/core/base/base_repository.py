"""
Generic abstract base class for all Django ORM repositories.
No view, service, or serializer accesses the ORM directly — they all use a
repository that extends this base (DIP).

Responsibility (SRP): declare the generic CRUD contract and enforce the pattern.
    Concrete repositories (AuthRepository, TicketRepository) provide the ORM queries.
Depends on: abc — nothing from the domain or Django ORM at this level.
Pattern: Repository
SOLID: DIP · OCP (new entity = new repo, no changes here) · LSP

Sprint usage:
    Sprint 1 → AuthRepository(BaseRepository[User])
    Sprint 2 → TicketRepository(BaseRepository[Ticket])
    Sprint 3 → NotificationRepository(BaseRepository[Notification])
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Optional, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Abstract CRUD contract parameterised on the Django model type T.

    All methods must be overridden. Any method that is not overridden will raise
    TypeError at instantiation time (Python ABC enforcement = LSP guarantee).
    """

    @abstractmethod
    def get_by_id(self, entity_id: int) -> Optional[T]:
        """
        Return the entity with the given primary key, or None if not found.
        Concrete implementation must NOT raise DoesNotExist — return None instead.
        """
        ...

    @abstractmethod
    def get_all(self, filters: dict | None = None) -> list[T]:
        """
        Return all entities matching the optional filter dict.
        Filter keys map directly to ORM field lookups (e.g. {'estado': 'ACTIVO'}).
        """
        ...

    @abstractmethod
    def create(self, data: dict) -> T:
        """
        Persist a new entity from the validated data dict and return it.
        Raises IntegrityError on constraint violations — do not swallow in this layer.
        """
        ...

    @abstractmethod
    def update(self, entity_id: int, data: dict) -> T:
        """
        Apply partial updates to the entity with the given ID and return it.
        Raises ObjectNotFound if the entity does not exist.
        """
        ...

    @abstractmethod
    def delete(self, entity_id: int) -> None:
        """
        Permanently remove the entity with the given ID.
        Raises ObjectNotFound if the entity does not exist.
        """
        ...
