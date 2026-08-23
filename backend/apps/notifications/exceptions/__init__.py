"""Notification-specific exceptions."""

from .email_relay_exceptions import (
    EmailRelayConfigurationError,
    EmailRelayDeliveryError,
    EmailRelayError,
    EmailRelayPayloadError,
)

__all__ = [
    "EmailRelayConfigurationError",
    "EmailRelayDeliveryError",
    "EmailRelayError",
    "EmailRelayPayloadError",
]
