"""
GalleryService — gallery/portfolio business logic (Singleton).

Mirrors CatalogService: lets the admin create/edit/toggle gallery projects and
exposes the active list to the public site. Image upload is delegated to
IStorageService (DIP), exactly like the catalog.
SOLID: DIP · SRP · LSP · OCP
"""

from __future__ import annotations

import threading

from apps.gallery.repositories import ProjectRepository
from apps.tickets.interfaces import IStorageService
from core.exceptions.domain_exceptions import DomainException


class ProjectNotFound(DomainException):
    """Raised when a gallery project does not exist."""


class GalleryService:

    def __init__(
        self,
        project_repository: ProjectRepository | None = None,
        storage: IStorageService | None = None,
    ) -> None:
        self._repo = project_repository or ProjectRepository()
        self._storage = storage

    # ── Public view ─────────────────────────────────────────────────────────────

    def get_active_projects(self) -> list:
        return [self._summary(p) for p in self._repo.get_active()]

    # ── Admin management ───────────────────────────────────────────────────────

    def list_all(self) -> list:
        return [self._detail(p) for p in self._repo.get_all()]

    def create_project(self, data: dict) -> dict:
        data = dict(data)
        imagen = data.pop("imagen", None)
        project = self._repo.create(data)
        project = self._maybe_attach_image(project, imagen)
        return self._detail(project)

    def edit_project(self, project_id: int, data: dict) -> dict:
        if self._repo.get_by_id(project_id) is None:
            raise ProjectNotFound("El proyecto no existe.")
        data = dict(data)
        imagen = data.pop("imagen", None)
        if data:
            project = self._repo.update(project_id, data)
        else:
            project = self._repo.get_by_id(project_id)
        project = self._maybe_attach_image(project, imagen)
        return self._detail(project)

    def toggle_active(self, project_id: int) -> dict:
        project = self._repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFound("El proyecto no existe.")
        project = self._repo.update(project_id, {"activo": not project.activo})
        return self._detail(project)

    # ── Image upload (Strategy via IStorageService) ────────────────────────────

    def _maybe_attach_image(self, project, imagen):
        if imagen is None or self._storage is None:
            return project
        path = f"gallery/{project.id}/{getattr(imagen, 'name', 'imagen')}"
        url = self._storage.upload(imagen, path)
        return self._repo.update(project.id, {"imagen_url": url})

    # ── Serialization helpers ──────────────────────────────────────────────────

    @staticmethod
    def _summary(p) -> dict:
        return {
            "id": p.id,
            "titulo": p.titulo,
            "descripcion": p.descripcion,
            "tag": p.tag,
            "imagen_url": p.imagen_url,
            "activo": p.activo,
            "orden": p.orden,
        }

    @classmethod
    def _detail(cls, p) -> dict:
        return {
            **cls._summary(p),
            "creado_en": p.created_at.isoformat(),
            "actualizado_en": p.updated_at.isoformat(),
        }


# ── Singleton accessor ─────────────────────────────────────────────────────────

_lock = threading.Lock()
_instance: GalleryService | None = None


def get_gallery_service() -> GalleryService:
    """Thread-safe singleton accessor."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                from apps.tickets.services.storage_service import StorageService  # noqa: PLC0415
                _instance = GalleryService(storage=StorageService())
    return _instance
