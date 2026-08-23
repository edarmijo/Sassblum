"""Unit tests for the Django cPanel relay email backend."""

from __future__ import annotations

from django.core.mail import EmailMultiAlternatives

from apps.notifications.backends.cpanel_relay_backend import CpanelRelayBackend
from apps.notifications.exceptions import EmailRelayDeliveryError
from apps.notifications.interfaces.i_email_relay_client import (
    IEmailRelayClient,
    RelayDeliveryResult,
    RelayPayload,
)
from apps.notifications.serializers.relay_message_serializer import RelayMessageSerializer

SENDER = "notificaciones@sassblum.com"


class RecordingRelayClient(IEmailRelayClient):
    def __init__(self, error: Exception | None = None) -> None:
        self.payloads: list[RelayPayload] = []
        self.error = error

    def deliver(self, payload: RelayPayload) -> RelayDeliveryResult:
        if self.error is not None:
            raise self.error
        self.payloads.append(payload)
        return {"status": "sent", "message_id": payload["message_id"]}


def build_message(subject: str = "Ticket T-2026-0125") -> EmailMultiAlternatives:
    message = EmailMultiAlternatives(
        subject=subject,
        body="Texto",
        from_email=SENDER,
        to=["cliente@example.com"],
        reply_to=[SENDER],
    )
    message.attach_alternative("<p>Texto</p>", "text/html")
    return message


def build_backend(
    client: IEmailRelayClient,
    fail_silently: bool = False,
) -> CpanelRelayBackend:
    return CpanelRelayBackend(
        fail_silently=fail_silently,
        relay_client=client,
        serializer=RelayMessageSerializer(SENDER),
    )


def test_send_messages_returns_confirmed_delivery_count() -> None:
    client = RecordingRelayClient()
    backend = build_backend(client)

    delivered = backend.send_messages([build_message("Uno"), build_message("Dos")])

    assert delivered == 2
    assert [payload["subject"] for payload in client.payloads] == ["Uno", "Dos"]


def test_send_messages_raises_when_fail_silently_is_false() -> None:
    client = RecordingRelayClient(EmailRelayDeliveryError("fallo controlado"))
    backend = build_backend(client)

    try:
        backend.send_messages([build_message()])
    except EmailRelayDeliveryError as exc:
        assert str(exc) == "fallo controlado"
    else:
        raise AssertionError("El backend debía propagar el error de entrega.")


def test_send_messages_returns_zero_when_fail_silently_is_true() -> None:
    client = RecordingRelayClient(EmailRelayDeliveryError("fallo controlado"))
    backend = build_backend(client, fail_silently=True)

    assert backend.send_messages([build_message()]) == 0


def test_send_messages_accepts_empty_batch() -> None:
    client = RecordingRelayClient()

    assert build_backend(client).send_messages([]) == 0
    assert client.payloads == []
