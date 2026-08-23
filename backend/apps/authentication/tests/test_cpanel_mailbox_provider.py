"""Contrato HTTP seguro del adaptador cPanel UAPI (sin acceso real)."""

from __future__ import annotations

from unittest.mock import Mock, patch

import pytest
import requests

from apps.authentication.interfaces import (
    MailboxProviderRejected,
    MailboxProviderUnavailable,
)
from apps.authentication.services.cpanel_mailbox_provider import (
    CpanelMailboxProvider,
)
from core.testing import random_credential


def provider() -> CpanelMailboxProvider:
    return CpanelMailboxProvider(
        host="cpanel.example.com",
        username="sassblum",
        api_token=random_credential(),
        quota_mb=1024,
        timeout_seconds=7,
    )


def response_with(data: object, status_code: int = 200) -> Mock:
    response = Mock()
    response.status_code = status_code
    response.is_redirect = 300 <= status_code < 400
    response.json.return_value = {
        "result": {"status": 1, "data": data, "errors": None},
    }
    return response


@patch("apps.authentication.services.cpanel_mailbox_provider.requests.post")
def test_mailbox_exists_matches_complete_address_case_insensitively(post: Mock) -> None:
    post.return_value = response_with([
        {"email": "Tecnico1@SassBlum.com"},
        {"email": "otro@sassblum.com"},
    ])

    assert provider().mailbox_exists("tecnico1@sassblum.com") is True


@patch("apps.authentication.services.cpanel_mailbox_provider.requests.post")
def test_create_sends_secret_in_body_not_url_and_refuses_redirects(post: Mock) -> None:
    post.return_value = response_with("tecnico1+sassblum.com")
    mailbox_credential = random_credential()

    provider().create_mailbox("tecnico1@sassblum.com", mailbox_credential)

    _, kwargs = post.call_args
    assert mailbox_credential not in post.call_args.args[0]
    assert kwargs["data"] == {
        "email": "tecnico1",
        "domain": "sassblum.com",
        "password": mailbox_credential,
        "quota": 1024,
    }
    assert kwargs["timeout"] == 7
    assert kwargs["allow_redirects"] is False


@patch("apps.authentication.services.cpanel_mailbox_provider.requests.post")
def test_authentication_failure_is_sanitized(post: Mock) -> None:
    post.return_value = response_with(None, status_code=403)

    with pytest.raises(MailboxProviderRejected) as error:
        provider().mailbox_exists("tecnico1@sassblum.com")

    assert "token" not in str(error.value).lower()
    assert "sassblum" not in str(error.value).lower()


@patch("apps.authentication.services.cpanel_mailbox_provider.requests.post")
def test_invalid_json_is_reported_without_raw_response(post: Mock) -> None:
    response = response_with(None)
    response.json.side_effect = ValueError("invalid json")
    post.return_value = response

    with pytest.raises(MailboxProviderUnavailable, match="respuesta no válida"):
        provider().mailbox_exists("tecnico1@sassblum.com")


@patch("apps.authentication.services.cpanel_mailbox_provider.requests.post")
def test_timeout_is_translated_to_retryable_unavailability(post: Mock) -> None:
    post.side_effect = requests.Timeout("provider timeout")

    with pytest.raises(MailboxProviderUnavailable, match="confirmar"):
        provider().mailbox_exists("tecnico1@sassblum.com")


@patch("apps.authentication.services.cpanel_mailbox_provider.requests.post")
def test_provider_quota_rejection_does_not_expose_raw_message(post: Mock) -> None:
    response = response_with(None)
    response.json.return_value = {
        "result": {
            "status": 0,
            "data": None,
            "errors": ["sensitive provider quota detail"],
        },
    }
    post.return_value = response

    with pytest.raises(MailboxProviderRejected) as error:
        provider().create_mailbox(
            "tecnico1@sassblum.com",
            random_credential(),
        )

    assert "sensitive" not in str(error.value)
