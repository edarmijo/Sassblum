"""
TicketConsumer — per-ticket WebSocket room for live updates (HU-09).

Responsibility (SRP): manage the connection to room ticket_{id} and relay
    ticket_updated messages. JWT validated on the handshake (?token=).
Pattern: Observer endpoint + Singleton transport (channel layer).
SOLID: SRP · DIP.
"""

from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.realtime.events.ticket_events import ticket_group


class TicketConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = await self._authenticate()
        if user is None:
            await self.close(code=4401)
            return
        self.ticket_id = self.scope["url_route"]["kwargs"]["ticket_id"]
        self.group_name = ticket_group(self.ticket_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        group = getattr(self, "group_name", None)
        if group:
            await self.channel_layer.group_discard(group, self.channel_name)

    async def ticket_updated(self, event):
        """Handler for {'type': 'ticket.updated', ...} → relay to the client."""
        await self.send_json({"event": "ticket_updated", "payload": event.get("payload", {})})

    async def _authenticate(self):
        from channels.db import database_sync_to_async  # noqa: PLC0415

        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_list = query.get("token", [])
        if not token_list:
            return None

        @database_sync_to_async
        def resolve_user(raw):
            try:
                from rest_framework_simplejwt.tokens import AccessToken  # noqa: PLC0415
                from apps.authentication.models import User  # noqa: PLC0415
                return User.objects.filter(id=AccessToken(raw)["user_id"]).first()
            except Exception:  # noqa: BLE001
                return None

        return await resolve_user(token_list[0])
