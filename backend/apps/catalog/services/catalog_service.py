"""
CatalogService — concrete implementation of both ISP catalog views (Singleton).

Responsibility (SRP): catalog business logic. Implements ICatalogClientView AND
    ICatalogAdminView — one Singleton serves both roles (LSP). Views receive the
    role-specific interface, never this class directly (DIP).
Depends on: ServiceRepository (DIP), IStorageService (DIP, for service photos),
    domain_exceptions.
Pattern: Singleton + Repository.
SOLID: DIP · SRP · LSP · ISP · OCP
"""

from __future__ import annotations

import threading

from apps.catalog.interfaces import ICatalogClientView, ICatalogAdminView
from apps.catalog.repositories import ServiceRepository
from apps.tickets.interfaces import IStorageService
from core.exceptions.domain_exceptions import ServiceNotFound


class CatalogService(ICatalogClientView, ICatalogAdminView):

    def __init__(
        self,
        service_repository: ServiceRepository | None = None,
        storage: IStorageService | None = None,
    ) -> None:
        self._repo = service_repository or ServiceRepository()
        self._storage = storage

    # ── Client view (browse) ───────────────────────────────────────────────────

    def get_active_services(self, filters: dict | None = None) -> list:
        filters = filters or {}
        services = self._repo.get_active(
            categoria=filters.get("categoria"),
            busqueda=filters.get("busqueda"),
        )
        return [self._summary(s) for s in services]

    def get_service_detail(self, service_id: int) -> dict:
        service = self._repo.get_by_id(service_id)
        if service is None or not service.activo:
            raise ServiceNotFound("El servicio no existe o no está disponible.")
        return self._detail(service)

    # ── Admin view (manage) ────────────────────────────────────────────────────

    def create_service(self, data: dict) -> dict:
        data = dict(data)
        imagen = data.pop("imagen", None)
        service = self._repo.create(data)
        service = self._maybe_attach_image(service, imagen)
        return self._detail(service)

    def edit_service(self, service_id: int, data: dict) -> dict:
        if self._repo.get_by_id(service_id) is None:
            raise ServiceNotFound("El servicio no existe.")
        data = dict(data)
        imagen = data.pop("imagen", None)
        if data:
            service = self._repo.update(service_id, data)
        else:
            service = self._repo.get_by_id(service_id)
        service = self._maybe_attach_image(service, imagen)
        return self._detail(service)

    def toggle_active(self, service_id: int) -> dict:
        service = self._repo.get_by_id(service_id)
        if service is None:
            raise ServiceNotFound("El servicio no existe.")
        service = self._repo.update(service_id, {"activo": not service.activo})
        return self._detail(service)

    # ── Image upload (Strategy via IStorageService) ────────────────────────────

    def _maybe_attach_image(self, service, imagen):
        if imagen is None or self._storage is None:
            return service
        path = f"services/{service.id}/{getattr(imagen, 'name', 'imagen')}"
        url = self._storage.upload(imagen, path)
        return self._repo.update(service.id, {"imagen_url": url})

    # ── Serialization helpers ──────────────────────────────────────────────────

    @staticmethod
    def _summary(s) -> dict:
        return {
            "id": s.id,
            "nombre": s.nombre,
            "descripcion": s.descripcion,
            "categoria": s.categoria,
            "activo": s.activo,
            "imagen_url": s.imagen_url,
        }

    @classmethod
    def _detail(cls, s) -> dict:
        return {
            **cls._summary(s),
            "creado_en": s.created_at.isoformat(),
            "actualizado_en": s.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

_lock = threading.Lock()
_instance: CatalogService | None = None


def get_catalog_service() -> CatalogService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.tickets.services.storage_service import StorageService  # noqa: PLC0415
                _instance = CatalogService(storage=StorageService())
    return _instance
