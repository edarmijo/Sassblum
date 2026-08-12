"""Customer-logo business logic, isolated behind repository and storage contracts."""

from __future__ import annotations

import re
import threading

from apps.clientes.interfaces import IClientLogoAdminView, IClientLogoPublicView
from apps.clientes.repositories import ClientLogoRepository
from apps.tickets.interfaces import IStorageService
from apps.tickets.services.storage_name import versioned_storage_filename
from core.exceptions.domain_exceptions import DomainException


CLIENT_LOGO_NOT_FOUND_MESSAGE = "El logotipo de cliente no existe."


class ClientLogoNotFound(DomainException):
    """Raised when an administrator addresses a logo that does not exist."""


class ClientLogoService(IClientLogoPublicView, IClientLogoAdminView):
    """Coordinates logo persistence and Supabase object lifecycle (SRP/DIP)."""

    def __init__(
        self,
        repository: ClientLogoRepository | None = None,
        storage: IStorageService | None = None,
    ) -> None:
        self._repo = repository or ClientLogoRepository()
        self._storage = storage

    def get_active_logos(self) -> list[dict]:
        return [self._summary(logo) for logo in self._repo.get_active()]

    def list_all(self) -> list[dict]:
        return [self._detail(logo) for logo in self._repo.get_all()]

    def create_logo(self, data: dict) -> dict:
        payload = dict(data)
        file = payload.pop("logo", None)
        if file is None and not payload.get("logo_url"):
            raise ValueError("Adjunta un archivo 'logo' o proporciona 'logo_url'.")
        logo = self._repo.create(payload)
        logo = self._maybe_attach_file(logo, file)
        return self._detail(logo)

    def edit_logo(self, logo_id: int, data: dict) -> dict:
        if self._repo.get_by_id(logo_id) is None:
            raise ClientLogoNotFound(CLIENT_LOGO_NOT_FOUND_MESSAGE)
        payload = dict(data)
        file = payload.pop("logo", None)
        logo = self._repo.update(logo_id, payload) if payload else self._repo.get_by_id(logo_id)
        logo = self._maybe_attach_file(logo, file)
        return self._detail(logo)

    def toggle_active(self, logo_id: int) -> dict:
        logo = self._repo.get_by_id(logo_id)
        if logo is None:
            raise ClientLogoNotFound(CLIENT_LOGO_NOT_FOUND_MESSAGE)
        return self._detail(self._repo.update(logo_id, {"activo": not logo.activo}))

    def delete_logo(self, logo_id: int) -> None:
        logo = self._repo.get_by_id(logo_id)
        if logo is None:
            raise ClientLogoNotFound(CLIENT_LOGO_NOT_FOUND_MESSAGE)
        path = self._managed_storage_path(logo.logo_url)
        if path and self._storage is not None:
            self._storage.delete(path)
        self._repo.delete(logo_id)

    def _maybe_attach_file(self, logo, file):
        if file is None:
            return logo
        if self._storage is None:
            raise RuntimeError("El almacenamiento de logotipos no está configurado.")
        path = f"clients/{logo.id}/{versioned_storage_filename(getattr(file, 'name', 'logo'))}"
        url = self._storage.upload(file, path)
        if not url:
            raise RuntimeError("No se pudo subir el logotipo al almacenamiento.")
        return self._repo.update(logo.id, {"logo_url": url})

    @staticmethod
    def _managed_storage_path(url: str) -> str | None:
        """Return only paths owned by this module; never delete external URLs."""
        match = re.search(r"/object/public/[^/]+/(clients/[^?#]+)", url or "")
        return match.group(1) if match else None

    @staticmethod
    def _summary(logo) -> dict:
        return {
            "id": logo.id,
            "nombre": logo.nombre,
            "logo_url": logo.logo_url,
            "sitio_web": logo.sitio_web,
            "orden": logo.orden,
        }

    @classmethod
    def _detail(cls, logo) -> dict:
        return {
            **cls._summary(logo),
            "activo": logo.activo,
            "creado_en": logo.created_at.isoformat(),
            "actualizado_en": logo.updated_at.isoformat(),
        }


_lock = threading.Lock()
_instance: ClientLogoService | None = None


def get_client_logo_service() -> ClientLogoService:
    """Return the thread-safe service singleton with the configured storage adapter."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.tickets.services.storage_service import StorageService

                _instance = ClientLogoService(storage=StorageService())
    return _instance
