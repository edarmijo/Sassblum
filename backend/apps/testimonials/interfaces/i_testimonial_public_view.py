from __future__ import annotations

from abc import ABC, abstractmethod


class ITestimonialPublicView(ABC):
    @abstractmethod
    def list_approved(self) -> list[dict]:
        """Return only moderated testimonials safe for public display."""
        ...
