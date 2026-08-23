"""Unit tests for the strict Django-to-relay message contract."""

from __future__ import annotations

import pytest
from django.core.mail import EmailMultiAlternatives

from apps.notifications.exceptions import EmailRelayPayloadError
from apps.notifications.serializers.relay_message_serializer import RelayMessageSerializer

SENDER = "notificaciones@sassblum.com"


def build_message() -> EmailMultiAlternatives:
    message = EmailMultiAlternatives(
        subject="[SassBlum] Ticket T-2026-0125 actualizado",
        body="El ticket cambió de estado.",
        from_email=SENDER,
        to=["cliente@example.com"],
        cc=["notificaciones@sassblum.com"],
        reply_to=[SENDER],
    )
    message.attach_alternative("<p>El ticket cambió de estado.</p>", "text/html")
    return message


def test_serialize_preserves_supported_email_fields() -> None:
    payload = RelayMessageSerializer(SENDER).serialize(build_message())

    assert payload["version"] == 1
    assert payload["subject"] == "[SassBlum] Ticket T-2026-0125 actualizado"
    assert payload["to"] == ["cliente@example.com"]
    assert payload["cc"] == ["notificaciones@sassblum.com"]
    assert payload["reply_to"] == [SENDER]
    assert payload["text_body"] == "El ticket cambió de estado."
    assert payload["html_body"] == "<p>El ticket cambió de estado.</p>"
    assert payload["message_id"]
    assert "from" not in payload


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("from_email", "attacker@example.com"),
        ("subject", "Asunto\r\nBcc: attacker@example.com"),
        ("to", []),
        ("to", ["dirección-inválida"]),
        ("bcc", ["oculto@example.com"]),
    ],
)
def test_serialize_rejects_unsafe_message_fields(field: str, value: object) -> None:
    message = build_message()
    setattr(message, field, value)

    with pytest.raises(EmailRelayPayloadError):
        RelayMessageSerializer(SENDER).serialize(message)


def test_serialize_rejects_duplicate_recipients() -> None:
    message = build_message()
    message.to = ["cliente@example.com", "CLIENTE@example.com"]

    with pytest.raises(EmailRelayPayloadError, match="duplicados"):
        RelayMessageSerializer(SENDER).serialize(message)


def test_serialize_rejects_attachments_and_arbitrary_headers() -> None:
    message = build_message()
    message.attach("archivo.txt", "contenido", "text/plain")
    with pytest.raises(EmailRelayPayloadError, match="adjuntos"):
        RelayMessageSerializer(SENDER).serialize(message)

    message = build_message()
    message.extra_headers = {"X-Untrusted": "value"}
    with pytest.raises(EmailRelayPayloadError, match="cabeceras"):
        RelayMessageSerializer(SENDER).serialize(message)


def test_serialize_rejects_payload_over_configured_size() -> None:
    message = build_message()
    message.body = "x" * 1024

    with pytest.raises(EmailRelayPayloadError, match="tamaño"):
        RelayMessageSerializer(SENDER, max_payload_bytes=128).serialize(message)
