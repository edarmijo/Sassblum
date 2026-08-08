"""Read-only contract consumed by the public customer carousel (ISP)."""

from __future__ import annotations

from abc import ABC, abstractmethod


class IClientLogoPublicView(ABC):
    @abstractmethod
    def get_active_logos(self) -> list[dict]:
        """Return only the logos allowed in the public carousel."""
        ...
