"""Contract for resolving email addressing without changing account identity."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Mapping


@dataclass(frozen=True)
class EmailAddressing:
    """Resolved addressing for one email delivery attempt."""

    to: tuple[str, ...]
    cc: tuple[str, ...]
    reply_to: tuple[str, ...]
    is_ticket_client: bool


class IEmailDeliveryPolicy(ABC):
    """Resolve channel-specific addresses from an account and event context."""

    @abstractmethod
    def resolve(
        self,
        recipient: object,
        context: Mapping[str, object],
    ) -> EmailAddressing | None:
        """Return addressing, or ``None`` when no safe destination exists."""
        ...
