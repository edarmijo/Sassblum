"""Unit tests for the HTTPS relay client."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
import requests

from apps.notifications.exceptions import (
    EmailRelayConfigurationError,
    EmailRelayDeliveryError,
)
from apps.notifications.interfaces.i_email_relay_client import RelayPayload
from apps.notifications.services.http_email_relay_client import HttpEmailRelayClient

RELAY_URL = "https://relay.sassblum.com/send"
RELAY_HOST = "relay.sassblum.com"
RELAY_SECRET = "s" * 64


def build_payload() -> RelayPayload:
    return {
        "version": 1,
        "message_id": "a3ef77bd-5b30-47c6-bf96-19cf6d7619d5",
        "subject": "Ticket T-2026-0125 actualizado",
        "to": ["cliente@example.com"],
        "cc": [],
        "reply_to": ["notificaciones@sassblum.com"],
        "text_body": "Texto",
        "html_body": "<p>Texto</p>",
    }


def build_session(status: str = "sent") -> tuple[MagicMock, MagicMock]:
    response = MagicMock()
    response.status_code = 200
    response.headers = {"Content-Type": "application/json; charset=utf-8"}
    response.json.return_value = {
        "status": status,
        "message_id": build_payload()["message_id"],
    }
    session = MagicMock()
    session.__enter__.return_value = session
    session.post.return_value = response
    return session, response


@pytest.mark.parametrize("status", ["sent", "duplicate"])
def test_deliver_posts_strict_payload_without_redirects(status: str) -> None:
    session, _ = build_session(status)
    client = HttpEmailRelayClient(
        RELAY_URL,
        RELAY_SECRET,
        RELAY_HOST,
        5,
        session_factory=MagicMock(return_value=session),
    )
    payload = build_payload()

    result = client.deliver(payload)

    assert result == {"status": status, "message_id": payload["message_id"]}
    kwargs = session.post.call_args.kwargs
    assert session.post.call_args.args == (RELAY_URL,)
    assert kwargs["json"] == payload
    assert kwargs["headers"][HttpEmailRelayClient.SECRET_HEADER] == RELAY_SECRET
    assert kwargs["timeout"] == (5.0, 5.0)
    assert kwargs["allow_redirects"] is False


@pytest.mark.parametrize(
    "url",
    [
        "http://relay.sassblum.com/send",
        "https://attacker.example/send",
        "https://relay.sassblum.com/send?secret=value",
        "https://user:pass@relay.sassblum.com/send",
        "https://relay.sassblum.com:8443/send",
        "https://relay.sassblum.com:invalid/send",
    ],
)
def test_constructor_rejects_unsafe_urls(url: str) -> None:
    with pytest.raises(EmailRelayConfigurationError):
        HttpEmailRelayClient(url, RELAY_SECRET, RELAY_HOST, 5)


def test_constructor_rejects_short_secret_and_invalid_timeout() -> None:
    with pytest.raises(EmailRelayConfigurationError, match="secreto"):
        HttpEmailRelayClient(RELAY_URL, "short", RELAY_HOST, 5)
    with pytest.raises(EmailRelayConfigurationError, match="timeout"):
        HttpEmailRelayClient(RELAY_URL, RELAY_SECRET, RELAY_HOST, 0)


def test_deliver_rejects_http_error_without_exposing_response_body() -> None:
    session, response = build_session()
    response.status_code = 429
    client = HttpEmailRelayClient(
        RELAY_URL,
        RELAY_SECRET,
        RELAY_HOST,
        5,
        session_factory=MagicMock(return_value=session),
    )

    with pytest.raises(EmailRelayDeliveryError, match="HTTP 429"):
        client.deliver(build_payload())


def test_deliver_rejects_invalid_confirmation() -> None:
    session, response = build_session()
    response.json.return_value = {"status": "sent", "message_id": "otro-id"}
    client = HttpEmailRelayClient(
        RELAY_URL,
        RELAY_SECRET,
        RELAY_HOST,
        5,
        session_factory=MagicMock(return_value=session),
    )

    with pytest.raises(EmailRelayDeliveryError, match="identificador"):
        client.deliver(build_payload())


def test_deliver_wraps_network_errors() -> None:
    session, _ = build_session()
    session.post.side_effect = requests.Timeout("timeout")
    client = HttpEmailRelayClient(
        RELAY_URL,
        RELAY_SECRET,
        RELAY_HOST,
        5,
        session_factory=MagicMock(return_value=session),
    )

    with pytest.raises(EmailRelayDeliveryError, match="contactar"):
        client.deliver(build_payload())
