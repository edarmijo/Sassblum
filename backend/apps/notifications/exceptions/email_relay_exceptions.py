"""Exceptions raised by the HTTPS email relay integration."""

from __future__ import annotations


class EmailRelayError(Exception):
    """Base error for relay configuration, payload, and delivery failures."""


class EmailRelayConfigurationError(EmailRelayError):
    """The relay backend cannot start with the configured values."""


class EmailRelayPayloadError(EmailRelayError):
    """A Django email cannot be represented by the allowed relay contract."""


class EmailRelayDeliveryError(EmailRelayError):
    """The relay did not confirm delivery of a serialized message."""
