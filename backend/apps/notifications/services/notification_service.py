"""
NotificationService — Singleton + Observer subject.

Responsibility (SRP): orchestrate notification dispatch across channels.
    Determines recipients by tipo_evento, respects preferences, delegates
    delivery to strategies via NotificationFactory. No channel logic here.
Depends on: INotificationService, NotificationFactory, NotificationRepository.
    User model loaded with deferred import to avoid circular at module level.
Pattern: Singleton (module-level lazy instance) + Observer subject.
SOLID: DIP · SRP · OCP

D4 — payload as dict (not TicketEvent instance):
    apps.notifications must NEVER import from apps.tickets.
    The signal handler in apps.tickets serializes the event before calling dispatch().

D5 — recipient selection by tipo_evento (logic lives here, not in strategies).

OCP: new tipo_evento = new branch in _resolve_recipients. NotificationFactory and
    strategies are never modified.
"""

from __future__ import annotations

import logging

from apps.notifications.interfaces import INotificationService

logger = logging.getLogger(__name__)


# ── Recipient selection ────────────────────────────────────────────────────────

def _add_user_by_id(recipients: set, user_id) -> None:
    """Agrega un User por id si existe (silencioso si no)."""
    from apps.authentication.models import User  # noqa: PLC0415
    if not user_id:
        return
    try:
        recipients.add(User.objects.get(id=user_id))
    except User.DoesNotExist:
        pass


def _exclude_author(recipients: set, event: dict, tipo: str) -> set:
    """
    Regla "sin auto-notificaciones", con UNA excepción: en 'creacion' el
    cliente-autor SÍ recibe su email de confirmación con el número de ticket
    (paridad LN-3 con el sistema legado).
    """
    autor_id = event.get("autor_id")
    if not autor_id:
        return recipients
    if tipo == "creacion" and autor_id == event.get("cliente_id"):
        return recipients
    return {r for r in recipients if r.id != autor_id}


def _resolve_recipients(event: dict) -> list:
    """
    Load User instances that should receive this notification.
    Deferred import avoids module-level coupling to apps.authentication.
    """
    from apps.authentication.models import User  # noqa: PLC0415

    tipo = event.get("tipo_evento", "")
    recipients: set = set()

    if tipo == "creacion":
        recipients.update(
            User.objects.filter(role=User.Role.ADMIN, estado=User.Estado.ACTIVE)
        )

    if tipo in ("cambio_estado", "comentario", "asignacion", "reasignacion", "creacion"):
        _add_user_by_id(recipients, event.get("cliente_id"))

    if tipo in ("asignacion", "reasignacion", "comentario"):
        _add_user_by_id(recipients, event.get("asignado_id"))

    return list(_exclude_author(recipients, event, tipo))


# ── NotificationService ────────────────────────────────────────────────────────

class NotificationService(INotificationService):
    """
    Singleton implementation of INotificationService.
    Receives TicketEvent payloads (as dicts) from the ticket signal handler and
    fans out notifications across each recipient's preferred channels.
    """

    def __init__(self, notification_repository=None) -> None:
        self._repo = notification_repository

    # ── Observer entry point ───────────────────────────────────────────────────

    def dispatch(self, event: dict) -> None:
        """Fan out a TicketEvent notification across all relevant recipients/channels."""
        recipients = _resolve_recipients(event)
        if not recipients:
            logger.debug("dispatch: no recipients for tipo_evento=%s", event.get("tipo_evento"))
            return

        message = self._format_message(event)
        for recipient in recipients:
            self._deliver_to_channels(event, recipient, message)

    def _deliver_to_channels(self, event: dict, recipient, message: str) -> None:
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415
        prefs = self.get_preferences(recipient)
        context = self._build_context(event, recipient)

        channels = [
            ("email",  prefs.get("email_activo",  True)),
            ("in_app", prefs.get("in_app_activo", True)),
            ("ws",     prefs.get("ws_activo",     True)),
        ]

        for channel, active in channels:
            if not active:
                continue
            try:
                repo = self._repo if channel == "in_app" else None
                strategy = NotificationFactory.build(channel, notification_repository=repo)
                if strategy.validate(recipient):
                    strategy.send(recipient, message, context)
                else:
                    strategy.log("skipped", f"{channel} invalid for user {recipient.id}")
            except Exception as exc:  # noqa: BLE001
                logger.exception(
                    "Notification delivery failed: channel=%s user=%s error=%s",
                    channel, recipient.id, exc,
                )

    # ── Query methods (serialized dicts for the API layer) ─────────────────────

    def get_user_notifications(self, user, page: int = 1) -> dict:
        result = self._repo.get_user_notifications(user, page)
        return {
            "items": [self._serialize(n) for n in result["items"]],
            "total": result["total"],
            "unread_count": result["unread_count"],
            "page": result["page"],
        }

    def mark_as_read(self, notification_id: int, user) -> dict:
        from core.exceptions.domain_exceptions import DomainException  # noqa: PLC0415
        notif = self._repo.mark_as_read(notification_id, user)
        if notif is None:
            raise DomainException("Notificación no encontrada.")
        return self._serialize(notif)

    def mark_all_as_read(self, user) -> int:
        """Mark every unread notification of the user as read. Returns rows affected."""
        return self._repo.mark_all_as_read(user)

    def get_preferences(self, user) -> dict:
        if self._repo is None:
            return {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        prefs = self._repo.get_or_create_preferences(user)
        return {
            "email_activo":  prefs.email_activo,
            "in_app_activo": prefs.in_app_activo,
            "ws_activo":     prefs.ws_activo,
        }

    def set_preferences(self, user, data: dict) -> dict:
        prefs = self._repo.get_or_create_preferences(user)
        updated = []
        for field in ("email_activo", "in_app_activo", "ws_activo"):
            if field in data:
                setattr(prefs, field, bool(data[field]))
                updated.append(field)
        if updated:
            prefs.save(update_fields=updated)
        return {
            "email_activo":  prefs.email_activo,
            "in_app_activo": prefs.in_app_activo,
            "ws_activo":     prefs.ws_activo,
        }

    # ── Private helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _serialize(notif) -> dict:
        return {
            "id": notif.id,
            "tipo": notif.tipo,
            "titulo": notif.titulo,
            "cuerpo": notif.cuerpo,
            "leida": notif.leida,
            "payload": notif.payload,
            "creado_en": notif.created_at.isoformat(),
        }

    def _build_context(self, event: dict, recipient) -> dict:
        tipo = event.get("tipo_evento", "informacion")
        return {
            "tipo":            tipo,
            "ticket_numero":   event.get("ticket_numero", ""),
            "ticket_asunto":   event.get("ticket_asunto", ""),
            # LN-3 (paridad legado): datos para el email de creación
            "ticket_descripcion": event.get("ticket_descripcion", ""),
            "cliente_email":   event.get("cliente_email", ""),
            "cliente_nombre":  event.get("cliente_nombre", ""),
            "cliente_ruc":     event.get("cliente_ruc", ""),
            "cliente_empresa": event.get("cliente_empresa", ""),
            "estado_anterior": event.get("estado_anterior", ""),
            "estado_nuevo":    event.get("estado_nuevo", ""),
            "comentario":      event.get("comentario", ""),
            "titulo":          self._make_title(tipo, event),
            "cuerpo":          event.get("comentario", "") or self._format_message(event),
            "recipient_nombre": getattr(recipient, "first_name", ""),
        }

    @staticmethod
    def _make_title(tipo: str, event: dict) -> str:
        numero = event.get("ticket_numero", "")
        titles = {
            "creacion":      f"Nuevo ticket {numero}",
            "cambio_estado": f"Ticket {numero} actualizado",
            "comentario":    f"Nuevo comentario en {numero}",
            "asignacion":    f"Ticket {numero} asignado",
            "reasignacion":  f"Ticket {numero} reasignado",
        }
        return titles.get(tipo, f"Notificación sobre {numero}")

    @staticmethod
    def _format_message(event: dict) -> str:
        tipo = event.get("tipo_evento", "")
        numero = event.get("ticket_numero", "")
        asunto = event.get("ticket_asunto", "")
        if tipo == "cambio_estado":
            return (
                f"El ticket {numero} ({asunto}) cambió de estado: "
                f"{event.get('estado_anterior')} → {event.get('estado_nuevo')}."
            )
        if tipo == "comentario":
            return f"Nuevo comentario en el ticket {numero}: {event.get('comentario', '')[:100]}"
        if tipo in ("asignacion", "reasignacion"):
            return f"El ticket {numero} ha sido asignado."
        return f"Actualización en el ticket {numero} ({asunto})."


# ── Singleton accessor ─────────────────────────────────────────────────────────

import threading  # noqa: E402

_lock = threading.Lock()
_instance: NotificationService | None = None


def get_notification_service() -> NotificationService:
    """
    Return (or lazily create) the shared NotificationService instance.
    Thread-safe via double-checked locking.

    On first call it wires a default NotificationRepository so the in-app channel
    works at runtime. Tests can reset `_instance` and inject a mock repository.
    """
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.notifications.repositories import NotificationRepository  # noqa: PLC0415
                _instance = NotificationService(NotificationRepository())
    return _instance
