"""
NotificationConsumer — per-user WebSocket channel for live notifications.

Responsibility (SRP): manage the WS connection lifecycle and relay messages.
    It does NOT decide what to send — NotificationService does (via WebSocketStrategy,
    which calls channel_layer.group_send to this consumer's group).
Depends on: Channels AsyncJsonWebsocketConsumer, apps.realtime.auth for handshake auth.
Pattern: Singleton transport (channel layer) + Observer endpoint.
SOLID: SRP · DIP

Group convention: 'notif_user_{user_id}' (matches WebSocketNotificationStrategy).

Handshake auth: JWT en el subprotocolo Sec-WebSocket-Protocol (ver apps/realtime/auth.py).
On failure the socket is closed with code 4401.
"""

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.realtime.auth import negotiated_subprotocol, resolve_user


class NotificationConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = await resolve_user(self.scope)
        if user is None:
            await self.close(code=4401)  # unauthorized
            return

        self.user = user
        self.group_name = f"notif_user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept(subprotocol=negotiated_subprotocol(self.scope))

    async def disconnect(self, code):
        group = getattr(self, "group_name", None)
        if group:
            await self.channel_layer.group_discard(group, self.channel_name)

    # ── Group message handler ──────────────────────────────────────────────────
    # Triggered by channel_layer.group_send({'type': 'notification.new', ...})
    async def notification_new(self, event):
        """Relay a new-notification payload down to the connected client."""
        await self.send_json({
            "event": "notification_new",
            "payload": event.get("payload", {}),
        })
