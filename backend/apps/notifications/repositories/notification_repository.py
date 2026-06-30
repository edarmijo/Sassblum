"""
NotificationRepository — encapsulates all ORM access for notifications (Repository).

Responsibility (SRP): every Notification / NotificationPreference query lives here.
    No view, service, or strategy touches the ORM directly (DIP).
Depends on: BaseRepository[Notification], Notification, NotificationPreference models.
Pattern: Repository.
SOLID: DIP · SRP · LSP (substitutable for BaseRepository in tests)

Implements the 5 generic CRUD methods from BaseRepository plus notification-specific
queries used by NotificationService and the DRF views.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.notifications.models import Notification, NotificationPreference

PAGE_SIZE = 20


class NotificationRepository(BaseRepository[Notification]):
    """ORM gateway for the notifications module."""

    # ── Generic CRUD (BaseRepository contract) ─────────────────────────────────

    def get_by_id(self, entity_id: int) -> Optional[Notification]:
        return Notification.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Notification]:
        qs = Notification.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Notification:
        return Notification.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Notification:
        Notification.objects.filter(pk=entity_id).update(**data)
        return Notification.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Notification.objects.filter(pk=entity_id).delete()

    # ── Notification-specific queries ──────────────────────────────────────────

    def get_unread_count(self, user) -> int:
        """Count of unread notifications — uses the partial index for speed."""
        return Notification.objects.filter(usuario=user, leida=False).count()

    def get_user_notifications(self, user, page: int = 1) -> dict:
        """
        Return a page of notifications for a user, newest first.
        Returns: {'items': list[Notification], 'total': int, 'unread_count': int, 'page': int}
        """
        base_qs = Notification.objects.filter(usuario=user)
        total = base_qs.count()
        unread = base_qs.filter(leida=False).count()

        start = (max(page, 1) - 1) * PAGE_SIZE
        items = list(base_qs[start:start + PAGE_SIZE])

        return {
            "items": items,
            "total": total,
            "unread_count": unread,
            "page": page,
        }

    def mark_as_read(self, notification_id: int, user) -> Optional[Notification]:
        """
        Mark a single notification as read, enforcing ownership.
        Returns the updated Notification, or None if not found / not owned.
        """
        notif = Notification.objects.filter(pk=notification_id, usuario=user).first()
        if notif is None:
            return None
        if not notif.leida:
            notif.leida = True
            notif.save(update_fields=["leida"])
        return notif

    def mark_all_as_read(self, user) -> int:
        """Mark every unread notification of the user as read. Returns rows affected."""
        return Notification.objects.filter(usuario=user, leida=False).update(leida=True)

    # ── Preferences ────────────────────────────────────────────────────────────

    def get_or_create_preferences(self, user) -> NotificationPreference:
        """Return the user's preferences, creating defaults (all channels on) if absent."""
        prefs, _ = NotificationPreference.objects.get_or_create(usuario=user)
        return prefs
