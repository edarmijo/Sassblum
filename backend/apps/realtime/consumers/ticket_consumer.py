"""
TicketConsumer — per-ticket WebSocket room for live updates (HU-09).

Responsibility (SRP): manage the connection to room ticket_{id} and relay
    ticket_updated messages. Handshake auth delegada a apps/realtime/auth.py
    (JWT en el subprotocolo Sec-WebSocket-Protocol — nunca en la URL).
Pattern: Observer endpoint + Singleton transport (channel layer).
SOLID: SRP · DIP.
"""

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.realtime.auth import negotiated_subprotocol, resolve_user
from apps.realtime.events.ticket_events import ticket_group


class TicketConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user = await resolve_user(self.scope)
        if user is None:
            await self.close(code=4401)
            return
        self.ticket_id = self.scope["url_route"]["kwargs"]["ticket_id"]
        self.group_name = ticket_group(self.ticket_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept(subprotocol=negotiated_subprotocol(self.scope))

    async def disconnect(self, code):
        group = getattr(self, "group_name", None)
        if group:
            await self.channel_layer.group_discard(group, self.channel_name)

    async def ticket_updated(self, event):
        """Handler for {'type': 'ticket.updated', ...} → relay to the client."""
        await self.send_json({"event": "ticket_updated", "payload": event.get("payload", {})})
