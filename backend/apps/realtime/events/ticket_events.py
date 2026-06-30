"""
Ticket realtime events — builds and broadcasts the ticket_updated payload (SRP).

Responsibility (SRP): only construct the event payload and push it to the ticket room.
    It does NOT decide when (the Observer/signal does). realtime depends on tickets
    (one-way); tickets stays unaware of the transport.
Pattern: Observer (consumer side) + Singleton (channel layer).
SOLID: SRP · DIP · OCP (new event = new builder, existing untouched).
"""

from __future__ import annotations

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def ticket_group(ticket_id: int) -> str:
    return f"ticket_{ticket_id}"


def build_ticket_updated_payload(event: dict) -> dict:
    """Shape a TicketEvent dict into the ticket_updated WS payload."""
    return {
        "ticket_id": event.get("ticket_id"),
        "ticket_numero": event.get("ticket_numero"),
        "tipo_evento": event.get("tipo_evento"),
        "estado_nuevo": event.get("estado_nuevo"),
        "comentario": event.get("comentario"),
    }


def broadcast_ticket_updated(event: dict) -> None:
    """Send ticket_updated to everyone subscribed to the ticket's room."""
    ticket_id = event.get("ticket_id")
    if ticket_id is None:
        return
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(
        ticket_group(ticket_id),
        {"type": "ticket.updated", "payload": build_ticket_updated_payload(event)},
    )
