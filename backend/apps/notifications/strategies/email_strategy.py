"""
Email notification strategy — delivers notifications via Django email backend.

Responsibility (SRP): render an HTML email template and send it. Nothing else.
Depends on: INotificationStrategy (interface), django.core.mail, django.template.loader.
Pattern: Strategy — implements INotificationStrategy for the email channel.
SOLID: SRP · DIP · OCP · LSP

OCP: new email template = new .html file + new entry in TEMPLATE_MAP.
    EmailNotificationStrategy is NEVER modified for new notification types.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from apps.notifications.interfaces import IEmailDeliveryPolicy, INotificationStrategy
from apps.notifications.policies import EmailDeliveryPolicy, TICKET_NOTIFICATION_TYPES

logger = logging.getLogger(__name__)

# Maps tipo_evento → (template_name, subject_prefix)
TEMPLATE_MAP: dict[str, tuple[str, str]] = {
    "creacion":      ("email/ticket_created.html",  "Nuevo ticket creado"),
    "asignacion":    ("email/ticket_assigned.html", "Ticket asignado"),
    "cambio_estado": ("email/status_changed.html",  "Ticket actualizado"),
    "comentario":    ("email/status_changed.html",  "Nuevo comentario en tu ticket"),
    "reasignacion":  ("email/ticket_assigned.html", "Ticket reasignado"),
    "password_reset": ("email/password_reset.html", "Recuperación de contraseña"),
    "email_verification": ("email/email_verification.html", "Verifica tu cuenta"),
}


class EmailNotificationStrategy(INotificationStrategy):
    """Sends HTML emails using Django's email backend."""

    def __init__(self, delivery_policy: IEmailDeliveryPolicy | None = None) -> None:
        self._delivery_policy = delivery_policy or EmailDeliveryPolicy()

    def validate(self, recipient) -> bool:
        return bool(
            recipient.is_authenticated
            and recipient.email
            and recipient.email_verificado
            and recipient.estado == "activo"
        )

    def send(self, recipient, message: str, context: dict) -> None:
        tipo = context.get("tipo", "creacion")
        template_name, subject_prefix = TEMPLATE_MAP.get(
            tipo, ("email/ticket_created.html", "Notificación SassBlum")
        )

        addressing = self._delivery_policy.resolve(recipient, context)
        if addressing is None:
            self.log(
                "skipped",
                f"email sin destino seguro · user_id={getattr(recipient, 'id', '')} · tipo={tipo}",
            )
            return

        subject = self._build_subject(str(tipo), subject_prefix, context)
        # Ensure recipient_nombre has a usable value even for admin accounts
        # created via createsuperuser (first_name may be empty).
        recipient_name = context.get("recipient_nombre") or recipient.email
        if addressing.is_ticket_client:
            recipient_name = context.get("cliente_nombre") or recipient_name
        enriched_context = {
            **context,
            "recipient": recipient,
            "recipient_nombre": recipient_name,
            "is_ticket_client": addressing.is_ticket_client,
            "support_phone": getattr(settings, "EMAIL_SUPPORT_PHONE", ""),
            "support_whatsapp": getattr(settings, "EMAIL_SUPPORT_WHATSAPP", ""),
            "request_anydesk": getattr(settings, "EMAIL_REQUEST_ANYDESK", False),
            "support_email": addressing.reply_to[0] if addressing.reply_to else "",
        }
        html_body = render_to_string(template_name, enriched_context)

        email = EmailMultiAlternatives(
            subject=subject,
            body=message,  # plain-text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=list(addressing.to),
            cc=list(addressing.cc) or None,
            reply_to=list(addressing.reply_to) or None,
        )
        email.attach_alternative(html_body, "text/html")
        email.send(fail_silently=False)
        self.log(
            "sent",
            f"email enviado · user_id={getattr(recipient, 'id', '')} · tipo={tipo}",
        )

    @staticmethod
    def _build_subject(tipo: str, subject_prefix: str, context: dict) -> str:
        ticket_number = str(context.get("ticket_numero", "")).strip()
        if tipo in TICKET_NOTIFICATION_TYPES and ticket_number:
            return f"[SassBlum] {subject_prefix} · {ticket_number}"
        return f"[SassBlum] {subject_prefix}"

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("EmailStrategy [%s] %s", status, details)
        else:
            logger.warning("EmailStrategy [%s] %s", status, details)
