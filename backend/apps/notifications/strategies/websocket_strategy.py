"""
WebSocket notification strategy — broadcasts via Django Channels channel layer.

Responsibility (SRP): push a notification payload to the user's WS group.
    No email, no DB write — just channel_layer.group_send().
Depends on: INotificationStrategy, channels.layers.get_channel_layer() (Channels).
Pattern: Strategy — implements INotificationStrategy for the WebSocket channel.
SOLID: SRP · DIP · OCP · LSP

The group name convention is 'notif_user_{user_id}'.
NotificationConsumer (S23) subscribes authenticated users to this group on connect().
"""

from __future__ import annotations

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)


def _group_name(user_id: int) -> str:
    return f"notif_user_{user_id}"


class WebSocketNotificationStrategy(INotificationStrategy):
    """Broadcasts notifications to the user's persistent WebSocket connection."""

    def validate(self, recipient) -> bool:
        # Fire-and-forget: always attempt; if the user is offline, the message is dropped.
        return bool(recipient.is_authenticated and recipient.estado == "activo")

    def send(self, recipient, message: str, context: dict) -> None:
        channel_layer = get_channel_layer()
        group = _group_name(recipient.id)

        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "notification.new",   # maps to NotificationConsumer.notification_new()
                "payload": {
                    "notification_id": context.get("notification_id"),
                    "tipo":   context.get("tipo", "informacion"),
                    "titulo": context.get("titulo", "Nueva notificación"),
                    "cuerpo": context.get("cuerpo", message),
                },
            },
        )
        self.log("sent", f"ws → group={group}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("WebSocketStrategy [%s] %s", status, details)
        else:
            logger.warning("WebSocketStrategy [%s] %s", status, details)
