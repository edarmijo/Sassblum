"""
In-app notification strategy — persists a Notification record in the database.

Responsibility (SRP): create a Notification row so the user sees it in the UI.
    No email, no WebSocket — just DB persistence via NotificationRepository.
Depends on: INotificationStrategy, NotificationRepository (via DIP — injected).
Pattern: Strategy — implements INotificationStrategy for the in-app channel.
SOLID: SRP · DIP · OCP · LSP

DIP: receives NotificationRepository via __init__, never touches the ORM directly.
OCP: new notification type = new entry in TEMPLATE_MAP (email); InApp only stores tipo + payload.
"""

from __future__ import annotations

import logging

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)


class InAppNotificationStrategy(INotificationStrategy):
    """Persists in-app notifications to the Notification model via repository."""

    def __init__(self, notification_repository) -> None:
        self._repo = notification_repository

    def validate(self, recipient) -> bool:
        return bool(
            recipient.is_authenticated
            and recipient.estado == "activo"
        )

    def send(self, recipient, message: str, context: dict) -> None:
        tipo   = context.get("tipo", "informacion")
        titulo = context.get("titulo", "Nueva notificación")
        cuerpo = context.get("cuerpo", message)

        self._repo.create({
            "usuario": recipient,
            "tipo": tipo,
            "titulo": titulo,
            "cuerpo": cuerpo,
            "leida": False,
            "payload": context,
        })
        self.log("sent", f"in_app → user_id={recipient.id} · tipo={tipo}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("InAppStrategy [%s] %s", status, details)
        else:
            logger.warning("InAppStrategy [%s] %s", status, details)
