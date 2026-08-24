"""Interface for delivering an allow-listed payload to an email relay."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Literal, TypedDict


class RelayPayload(TypedDict):
    """Versioned message contract accepted by the cPanel relay."""

    version: int
    message_id: str
    subject: str
    to: list[str]
    cc: list[str]
    reply_to: list[str]
    text_body: str
    html_body: str


class RelayDeliveryResult(TypedDict):
    """Sanitized confirmation returned by the relay."""

    status: Literal["sent", "duplicate"]
    message_id: str


class IEmailRelayClient(ABC):
    """Transport seam used by the Django email backend."""

    @abstractmethod
    def deliver(self, payload: RelayPayload) -> RelayDeliveryResult:
        """Deliver one payload or raise a typed relay exception."""
