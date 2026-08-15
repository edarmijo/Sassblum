from __future__ import annotations

from abc import ABC, abstractmethod

from apps.authentication.models import User


class ITestimonialClientActions(ABC):
    @abstractmethod
    def get_for_client(self, client: User) -> dict | None:
        ...

    @abstractmethod
    def create_for_client(self, client: User, data: dict) -> dict:
        ...

    @abstractmethod
    def update_for_client(self, client: User, data: dict) -> dict:
        ...

    @abstractmethod
    def delete_for_client(self, client: User) -> None:
        ...
