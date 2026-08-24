"""Fail-fast validation for the optional cPanel relay email backend."""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.validators import validate_email


@dataclass(frozen=True)
class CpanelRelayConfiguration:
    """Values required only when the cPanel relay backend is selected."""

    backend: str
    from_email: str
    relay_url: str
    allowed_host: str
    secret: str
    timeout_seconds: float
    max_payload_bytes: int


class CpanelRelayConfigurationValidator:
    """Validate relay settings without changing the common email validator."""

    BACKEND = "apps.notifications.backends.cpanel_relay_backend.CpanelRelayBackend"
    INVALID_CONFIGURATION_MESSAGE = (
        "La configuración del relay cPanel es incompleta o inválida."
    )

    def validate(self, configuration: CpanelRelayConfiguration) -> None:
        """Raise ``ImproperlyConfigured`` before the first delivery attempt."""
        if configuration.backend != self.BACKEND:
            return
        try:
            validate_email(configuration.from_email)
        except ValidationError as exc:
            raise ImproperlyConfigured(self.INVALID_CONFIGURATION_MESSAGE) from exc
        parsed = urlsplit(configuration.relay_url)
        try:
            port = parsed.port
        except ValueError as exc:
            raise ImproperlyConfigured(self.INVALID_CONFIGURATION_MESSAGE) from exc
        allowed_host = configuration.allowed_host.strip().lower()
        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or not allowed_host
            or parsed.hostname.lower() != allowed_host
            or parsed.username
            or parsed.password
            or parsed.query
            or parsed.fragment
            or port not in (None, 443)
            or len(configuration.secret) < 32
            or "\r" in configuration.secret
            or "\n" in configuration.secret
            or configuration.timeout_seconds <= 0
            or configuration.timeout_seconds > 60
            or configuration.max_payload_bytes <= 0
        ):
            raise ImproperlyConfigured(self.INVALID_CONFIGURATION_MESSAGE)
