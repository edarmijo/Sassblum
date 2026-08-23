"""Eventos realtime para revocar conexiones autenticadas de un usuario."""

from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def session_group(user_id: int) -> str:
    """Nombre estable del grupo de control de sesiones de un usuario."""
    return f"session_user_{user_id}"


def broadcast_session_revoked(user_id: int) -> None:
    """Ordena cerrar todas las conexiones WebSocket vigentes del usuario."""
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(
        session_group(user_id),
        {"type": "session.revoked"},
    )
