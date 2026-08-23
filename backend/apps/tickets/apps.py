"""
TicketsConfig — Django app config that wires the Observer signal.

Responsibility (SRP): configure the app and register the post_save signal on TicketEvent.
    Signal registration lives here (not in models.py) to avoid import-time side effects
    and to keep models free of cross-module knowledge (SRP).

Observer pattern:
    Emitter:  TicketEvent (post_save)
    Receiver: NotificationService.dispatch(event)
    The import of NotificationService is deferred inside the handler to avoid a
    circular import between apps.tickets and apps.notifications.

DIP:
    The handler calls NotificationService via its module path.
    In Sprint 3, when NotificationService gains strategy implementations,
    this handler does not change (OCP).
"""

from django.apps import AppConfig


class TicketsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.tickets"

    def ready(self) -> None:
        """Register signals after all models are loaded."""
        from django.db.models.signals import post_save
        from django.dispatch import receiver

        from apps.tickets.models import TicketEvent

        @receiver(post_save, sender=TicketEvent, dispatch_uid="ticket_event_notify")
        def on_ticket_event_saved(sender, instance: TicketEvent, created: bool, **kwargs) -> None:
            """
            Dispatch a notification whenever a new TicketEvent is persisted.
            Only fires on INSERT (created=True) — updates to events are not expected
            since TicketEvents are append-only.

            D4 — the event is serialized to a plain dict HERE (in apps.tickets) before
            crossing into apps.notifications. This keeps the dependency one-way:
                apps.tickets → apps.notifications  (notifications NEVER imports tickets)
            The deferred import of the service avoids a circular import at module load.
            """
            if not created:
                return

            # Serialize the TicketEvent to a transport dict (no model crosses the boundary)
            ticket = instance.ticket
            event_payload = {
                "ticket_id":       ticket.id,
                "ticket_numero":   ticket.numero,
                "ticket_asunto":   ticket.asunto,
                # LN-3/B1/B9: use the per-ticket contact snapshot. Its effective
                # properties retain the legacy/contact correction while falling
                # back to the account only for tickets created before the snapshot.
                "ticket_descripcion": ticket.descripcion,
                "cliente_email":   ticket.contacto_email_efectivo,
                "cliente_nombre":  ticket.contacto_nombre_efectivo,
                "cliente_ruc":     ticket.contacto_ruc_efectivo,
                "cliente_empresa": ticket.contacto_empresa_efectiva,
                "tipo_evento":     instance.tipo_evento,
                "estado_anterior": instance.estado_anterior,
                "estado_nuevo":    instance.estado_nuevo,
                "comentario":      instance.comentario,
                "autor_id":        instance.autor_id,
                "cliente_id":      ticket.cliente_id,
                "asignado_id":     ticket.asignado_id,
                "asignado_anterior_id": instance.asignado_anterior_id,
            }

            try:
                # Deferred import — prevents circular import at module load time
                from apps.notifications.services import get_notification_service  # noqa: PLC0415
                get_notification_service().dispatch(event_payload)
            except ImportError:
                # NotificationService not available (e.g. notifications app disabled).
                # Signal stays wired; handler is a safe no-op.
                pass
            except Exception:  # noqa: BLE001
                import logging  # noqa: PLC0415
                logging.getLogger(__name__).exception(
                    "Failed to dispatch notification for TicketEvent %s",
                    instance.id,
                )
