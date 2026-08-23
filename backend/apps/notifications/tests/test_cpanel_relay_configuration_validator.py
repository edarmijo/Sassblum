"""Combined fail-fast validation for the optional cPanel relay backend."""

from dataclasses import replace

import pytest
from django.core.exceptions import ImproperlyConfigured

from apps.notifications.validators import (
    CpanelRelayConfiguration,
    CpanelRelayConfigurationValidator,
)


@pytest.fixture
def valid_relay_configuration() -> CpanelRelayConfiguration:
    return CpanelRelayConfiguration(
        backend=CpanelRelayConfigurationValidator.BACKEND,
        from_email="notificaciones@sassblum.com",
        relay_url="https://relay.sassblum.com/",
        allowed_host="relay.sassblum.com",
        secret="s" * 64,
        timeout_seconds=10,
        max_payload_bytes=262_144,
    )


def test_valid_relay_configuration_passes(valid_relay_configuration):
    CpanelRelayConfigurationValidator().validate(valid_relay_configuration)


def test_other_backend_does_not_require_relay_configuration():
    configuration = CpanelRelayConfiguration(
        backend="anymail.backends.brevo.EmailBackend",
        from_email="notificaciones@sassblum.com",
        relay_url="",
        allowed_host="",
        secret="",
        timeout_seconds=0,
        max_payload_bytes=0,
    )

    CpanelRelayConfigurationValidator().validate(configuration)


@pytest.mark.parametrize(
    "changes",
    [
        {"relay_url": ""},
        {"relay_url": "http://relay.sassblum.com/"},
        {"allowed_host": "otro.example"},
        {"secret": "short"},
        {"timeout_seconds": 0},
        {"max_payload_bytes": 0},
    ],
)
def test_invalid_selected_relay_configuration_fails_early(
    valid_relay_configuration, changes
):
    configuration = replace(valid_relay_configuration, **changes)

    with pytest.raises(ImproperlyConfigured, match="relay cPanel"):
        CpanelRelayConfigurationValidator().validate(configuration)
