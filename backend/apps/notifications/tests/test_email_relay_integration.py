"""Contract test joining B4 email construction with the B14 relay serializer."""

from types import SimpleNamespace

from django.core.mail import EmailMultiAlternatives

from apps.notifications.serializers.relay_message_serializer import RelayMessageSerializer
from apps.notifications.strategies.email_strategy import EmailNotificationStrategy


def test_transactional_email_reaches_relay_with_equivalent_utf8_parts(
    monkeypatch, settings
):
    settings.DEFAULT_FROM_EMAIL = "notificaciones@sassblum.com"
    settings.EMAIL_REPLY_TO = ["notificaciones@sassblum.com"]
    settings.EMAIL_CC = ["auditoria@sassblum.com"]
    settings.EMAIL_SUPPORT_PHONE = "+593 96 999 0990"
    settings.EMAIL_SUPPORT_WHATSAPP = ""
    settings.EMAIL_REQUEST_ANYDESK = True
    payloads = []

    def capture_send(message, fail_silently=False):
        assert fail_silently is False
        payloads.append(
            RelayMessageSerializer(settings.DEFAULT_FROM_EMAIL).serialize(message)
        )
        return 1

    monkeypatch.setattr(EmailMultiAlternatives, "send", capture_send)
    recipient = SimpleNamespace(
        id=7,
        email="cuenta@example.com",
        first_name="Vicky",
        role="client",
        is_authenticated=True,
        email_verificado=True,
        estado="activo",
    )
    context = {
        "tipo": "cambio_estado",
        "cliente_id": 7,
        "cliente_email": "contacto-corregido@example.com",
        "cliente_nombre": "Víctoria Pinto",
        "ticket_numero": "T-2026-0001",
        "ticket_asunto": "Impresión detenida",
        "estado_anterior": "EnProceso",
        "estado_nuevo": "Resuelto",
        "comentario": "Solución aplicada: calibración y revisión eléctrica.",
        "recipient_role": "client",
    }

    EmailNotificationStrategy().send(recipient, "mensaje anterior", context)

    assert len(payloads) == 1
    payload = payloads[0]
    assert payload["subject"] == "[SassBlum] Ticket actualizado · T-2026-0001"
    assert payload["to"] == ["contacto-corregido@example.com"]
    assert payload["cc"] == ["auditoria@sassblum.com"]
    assert payload["reply_to"] == ["notificaciones@sassblum.com"]
    for expected in (
        "Víctoria Pinto",
        "Impresión detenida",
        "Observaciones/Solución",
        "Solución aplicada: calibración y revisión eléctrica.",
        "El estado actual de su ticket es:",
        "Gracias por confiar en nosotros",
    ):
        assert expected in payload["text_body"]
        assert expected in payload["html_body"]
