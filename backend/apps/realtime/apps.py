"""
RealtimeConfig — wires the ticket realtime Observer.

ready() registers a post_save(TicketEvent) handler that broadcasts ticket_updated to
the ticket's WS room. This is a SECOND, independent subscriber to the same signal that
notifications uses (OCP: adding a subscriber doesn't touch TicketEvent or notifications).
Dependency direction: realtime → tickets (one-way); tickets stays unaware.
"""

from django.apps import AppConfig


class RealtimeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.realtime"

    def ready(self) -> None:
        from django.db.models.signals import post_save
        from django.dispatch import receiver

        from apps.tickets.models import TicketEvent

        @receiver(post_save, sender=TicketEvent, dispatch_uid="ticket_event_realtime")
        def on_ticket_event_realtime(sender, instance: TicketEvent, created: bool, **kwargs):
            if not created:
                return
            ticket = instance.ticket
            payload = {
                "ticket_id": ticket.id,
                "ticket_numero": ticket.numero,
                "tipo_evento": instance.tipo_evento,
                "estado_nuevo": instance.estado_nuevo,
                "comentario": instance.comentario,
            }
            try:
                from apps.realtime.events.ticket_events import broadcast_ticket_updated
                broadcast_ticket_updated(payload)
            except Exception:  # noqa: BLE001
                import logging  # noqa: PLC0415
                logging.getLogger(__name__).exception(
                    "Failed to broadcast realtime update for TicketEvent %s",
                    instance.id,
                )
