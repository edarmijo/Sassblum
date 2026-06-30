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
from django.core.mail import send_mail
from django.template.loader import render_to_string

from apps.notifications.interfaces import INotificationStrategy

logger = logging.getLogger(__name__)

# Maps tipo_evento → (template_name, subject_prefix)
TEMPLATE_MAP: dict[str, tuple[str, str]] = {
    "creacion":      ("email/ticket_created.html",  "Nuevo ticket creado"),
    "asignacion":    ("email/ticket_assigned.html", "Ticket asignado"),
    "cambio_estado": ("email/status_changed.html",  "Ticket actualizado"),
    "comentario":    ("email/status_changed.html",  "Nuevo comentario en tu ticket"),
    "reasignacion":  ("email/ticket_assigned.html", "Ticket reasignado"),
    "password_reset": ("email/password_reset.html", "Recuperación de contraseña"),
}


class EmailNotificationStrategy(INotificationStrategy):
    """Sends HTML emails using Django's email backend."""

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

        subject = f"[SassBlum] {subject_prefix}"
        html_body = render_to_string(template_name, {**context, "recipient": recipient})

        send_mail(
            subject=subject,
            message=message,  # plain-text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            html_message=html_body,
            fail_silently=False,
        )
        self.log("sent", f"email → {recipient.email} · tipo={tipo}")

    def log(self, status: str, details: str) -> None:
        if status == "sent":
            logger.info("EmailStrategy [%s] %s", status, details)
        else:
            logger.warning("EmailStrategy [%s] %s", status, details)
