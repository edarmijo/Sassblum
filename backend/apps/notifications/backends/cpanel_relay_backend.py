"""Django email backend that delegates delivery to the secure cPanel relay."""

from __future__ import annotations

import logging
from collections.abc import Sequence

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage

from apps.notifications.interfaces.i_email_relay_client import IEmailRelayClient
from apps.notifications.serializers.relay_message_serializer import RelayMessageSerializer
from apps.notifications.services.http_email_relay_client import HttpEmailRelayClient

logger = logging.getLogger(__name__)


class CpanelRelayBackend(BaseEmailBackend):
    """Serialize and deliver Django emails without changing notification logic."""

    def __init__(
        self,
        fail_silently: bool = False,
        relay_client: IEmailRelayClient | None = None,
        serializer: RelayMessageSerializer | None = None,
        **kwargs: object,
    ) -> None:
        super().__init__(fail_silently=fail_silently, **kwargs)
        self._serializer = serializer or RelayMessageSerializer(
            expected_from_email=settings.DEFAULT_FROM_EMAIL,
            max_payload_bytes=int(
                getattr(settings, "CPANEL_RELAY_MAX_PAYLOAD_BYTES", 262_144)
            ),
        )
        self._relay_client = relay_client or HttpEmailRelayClient(
            relay_url=getattr(settings, "CPANEL_RELAY_URL", ""),
            relay_secret=getattr(settings, "CPANEL_RELAY_SECRET", ""),
            expected_host=getattr(
                settings,
                "CPANEL_RELAY_ALLOWED_HOST",
                "relay.sassblum.com",
            ),
            timeout_seconds=float(
                getattr(settings, "CPANEL_RELAY_TIMEOUT_SECONDS", 10)
            ),
        )

    def send_messages(
        self,
        email_messages: Sequence[EmailMessage] | None,
    ) -> int:
        """Return the number confirmed by the relay and honor fail_silently."""
        if not email_messages:
            return 0

        delivered = 0
        for index, message in enumerate(email_messages):
            try:
                payload = self._serializer.serialize(message)
                self._relay_client.deliver(payload)
                delivered += 1
            except Exception as exc:  # Django backend contract requires broad handling.
                if not self.fail_silently:
                    raise
                logger.error(
                    "Email relay delivery failed silently: message_index=%s error_type=%s",
                    index,
                    type(exc).__name__,
                )
        return delivered
