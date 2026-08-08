"""Admin-only customer-logo management contract (ISP)."""

from __future__ import annotations

from abc import ABC, abstractmethod


class IClientLogoAdminView(ABC):
    @abstractmethod
    def list_all(self) -> list[dict]:
        ...

    @abstractmethod
    def create_logo(self, data: dict) -> dict:
        ...

    @abstractmethod
    def edit_logo(self, logo_id: int, data: dict) -> dict:
        ...

    @abstractmethod
    def toggle_active(self, logo_id: int) -> dict:
        ...

    @abstractmethod
    def delete_logo(self, logo_id: int) -> None:
        ...
