"""
NotificationConsumer — per-user WebSocket channel for live notifications.

Responsibility (SRP): manage the WS connection lifecycle and relay messages.
    It does NOT decide what to send — NotificationService does (via WebSocketStrategy,
    which calls channel_layer.group_send to this consumer's group).
Depends on: Channels AsyncJsonWebsocketConsumer, simplejwt for handshake auth.
Pattern: Singleton transport (channel layer) + Observer endpoint.
SOLID: SRP · DIP

Group convention: 'notif_user_{user_id}' (matches WebSocketNotificationStrategy).

Handshake auth:
    The JWT is passed as ?token=<access> in the WS URL query string.
    connect() validates it; on failure the socket is closed with code 4401.
"""

from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class NotificationConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = await self._authenticate()
        if user is None:
            await self.close(code=4401)  # unauthorized
            return

        self.user = user
        self.group_name = f"notif_user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

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

    # ── Handshake authentication ───────────────────────────────────────────────
    async def _authenticate(self):
        """
        Validate the JWT from the query string and return the User, or None.
        Uses simplejwt's AccessToken to decode + verify.
        """
        from channels.db import database_sync_to_async  # noqa: PLC0415

        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_list = query.get("token", [])
        if not token_list:
            return None

        @database_sync_to_async
        def resolve_user(raw_token):
            try:
                from rest_framework_simplejwt.tokens import AccessToken  # noqa: PLC0415
                from apps.authentication.models import User  # noqa: PLC0415
                access = AccessToken(raw_token)
                return User.objects.filter(id=access["user_id"]).first()
            except Exception:  # noqa: BLE001
                return None

        return await resolve_user(token_list[0])
