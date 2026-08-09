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
from urllib.parse import urlparse

from apps.catalog.interfaces import ICatalogClientView, ICatalogAdminView
from apps.catalog.repositories import ServiceRepository
from apps.tickets.interfaces import IStorageService
from apps.tickets.services.storage_name import storage_filename
from core.exceptions.domain_exceptions import ServiceHasTickets, ServiceNotFound


SERVICE_NOT_FOUND_MESSAGE = "El servicio no existe."


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
            raise ServiceNotFound(SERVICE_NOT_FOUND_MESSAGE)
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
            raise ServiceNotFound(SERVICE_NOT_FOUND_MESSAGE)
        service = self._repo.update(service_id, {"activo": not service.activo})
        return self._detail(service)

    def delete_service(self, service_id: int) -> None:
        service = self._repo.get_by_id(service_id)
        if service is None:
            raise ServiceNotFound(SERVICE_NOT_FOUND_MESSAGE)
        if service.tickets.exists():
            raise ServiceHasTickets(
                "No se puede eliminar un servicio con tickets asociados. "
                "OcÃºltalo para conservar el historial."
            )

        urls = [service.imagen_url, *(image.imagen_url for image in service.imagenes.all())]
        self._delete_managed_files(urls, f"services/{service_id}/")
        # ServiceImage uses CASCADE, so dependent gallery rows are deleted with
        # the parent service in a single database operation.
        self._repo.delete(service_id)

    # ── Gallery image management (ICatalogAdminView) ───────────────────────────

    def add_service_image(self, service_id: int, file) -> dict:
        service = self._repo.get_by_id(service_id)
        if service is None:
            raise ServiceNotFound(SERVICE_NOT_FOUND_MESSAGE)
        orden = self._repo.get_next_order(service_id)
        path = f"services/{service_id}/gallery/{storage_filename(getattr(file, 'name', 'imagen'))}"
        url = self._storage.upload(file, path) if self._storage is not None else ""
        if not url:
            raise RuntimeError("No se pudo subir la imagen al almacenamiento.")
        img = self._repo.add_image(service_id, url, orden)
        return {"id": img.id, "imagen_url": img.imagen_url, "orden": img.orden}

    def delete_service_image(self, image_id: int) -> None:
        img = self._repo.get_image_by_id(image_id)
        if img is None:
            return
        self._delete_managed_files([img.imagen_url], f"services/{img.servicio_id}/")
        self._repo.delete_image(image_id)

    # ── Image upload (Strategy via IStorageService) ────────────────────────────

    def _maybe_attach_image(self, service, imagen):
        if imagen is None or self._storage is None:
            return service
        path = f"services/{service.id}/cover/{storage_filename(getattr(imagen, 'name', 'imagen'))}"
        url = self._storage.upload(imagen, path)
        if not url:
            return service
        return self._repo.update(service.id, {"imagen_url": url})

    def _delete_managed_files(self, urls: list[str], allowed_prefix: str) -> None:
        """Delete only Supabase objects owned by this service."""
        if self._storage is None:
            return
        for url in urls:
            path = self._managed_storage_path(url, allowed_prefix)
            if path is not None:
                self._storage.delete(path)

    @staticmethod
    def _managed_storage_path(url: str, allowed_prefix: str) -> str | None:
        public_marker = "/object/public/"
        storage_path = urlparse(url).path
        if public_marker not in storage_path:
            return None
        _, _, bucket_and_object = storage_path.partition(public_marker)
        _, separator, object_path = bucket_and_object.partition("/")
        if not separator or not object_path.startswith(allowed_prefix):
            return None
        return object_path

    # ── Serialization helpers ──────────────────────────────────────────────────

    @staticmethod
    def _summary(s) -> dict:
        return {
            "id": s.id,
            "nombre": s.nombre,
            "descripcion": s.descripcion,
            "descripcion_detalle": s.descripcion_detalle,
            "categoria": s.categoria,
            "activo": s.activo,
            "imagen_url": s.imagen_url,
            "imagenes": [
                {"id": img.id, "imagen_url": img.imagen_url, "orden": img.orden}
                for img in s.imagenes.all()
            ],
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
