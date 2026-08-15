from __future__ import annotations

from abc import ABC, abstractmethod

from apps.authentication.models import User


class ITestimonialAdminActions(ABC):
    @abstractmethod
    def list_for_moderation(self) -> list[dict]:
        ...

    @abstractmethod
    def moderate(self, testimonial_id: int, moderator: User, data: dict) -> dict:
        ...
