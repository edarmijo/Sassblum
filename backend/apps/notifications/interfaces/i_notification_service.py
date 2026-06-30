"""
Root ABC for the notification service — Observer subject.

Responsibility (SRP): declare the contract for dispatching and querying notifications.
    No channel logic, no ORM access — only orchestration signatures.
Depends on: abc.ABC — nothing from the domain.
Pattern: Singleton (the concrete NotificationService is a module-level singleton)
         + Observer subject (receives events from the ticket signal).
SOLID: DIP · OCP · SRP

Sprint coverage:
    S19 → this file (contract)
    S20 → NotificationService(INotificationService) — Singleton implementation
    S26 → useNotifications hook depends on this interface on the FE side
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class INotificationService(ABC):
    """Abstract contract for notification dispatch and management."""

    @abstractmethod
    def dispatch(self, event: dict) -> None:
        """
        Observer entry point — called by the post_save(TicketEvent) signal handler.

        Args:
            event: serialized dict of a TicketEvent (not the model instance, to avoid
                   circular import between apps.tickets and apps.notifications).
                   Keys: ticket_id, tipo_evento, estado_anterior, estado_nuevo,
                         comentario, autor_id, cliente_id, asignado_id.

        Behavior:
            1. Determines recipients based on tipo_evento (SRP: this method decides who).
            2. Loads NotificationPreference for each recipient.
            3. For each active channel: NotificationFactory.build(canal).send().
        """
        ...

    @abstractmethod
    def get_user_notifications(self, user, page: int = 1) -> dict:
        """
        Return paginated notifications for the given user.

        Returns:
            {'items': list[dict], 'total': int, 'unread_count': int, 'page': int}
        """
        ...

    @abstractmethod
    def mark_as_read(self, notification_id: int, user) -> dict:
        """
        Mark a single notification as read. Enforces ownership.

        Returns: updated notification dict.
        Raises: NotificationNotFound if not found or not owned by user.
        """
        ...

    @abstractmethod
    def get_preferences(self, user) -> dict:
        """
        Return (or create with defaults) the NotificationPreference for the user.

        Returns: {'email_activo': bool, 'in_app_activo': bool, 'ws_activo': bool}
        """
        ...

    @abstractmethod
    def set_preferences(self, user, data: dict) -> dict:
        """
        Update the NotificationPreference for the user.

        Args:
            data: partial dict with any of email_activo, in_app_activo, ws_activo.

        Returns: updated preferences dict.
        """
        ...
