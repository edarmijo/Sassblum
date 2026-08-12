"""
GalleryService — gallery/portfolio business logic (Singleton).

Mirrors CatalogService: lets the admin create/edit/toggle gallery projects and
exposes the active list to the public site. Image upload is delegated to
IStorageService (DIP), exactly like the catalog.
SOLID: DIP · SRP · LSP · OCP
"""

from __future__ import annotations

import threading

from apps.gallery.models import Project
from apps.gallery.repositories import ProjectRepository
from apps.tickets.interfaces import IStorageService
from apps.tickets.services.storage_name import (
    managed_public_object_path,
    versioned_storage_filename,
)
from core.exceptions.domain_exceptions import DomainException


PROJECT_NOT_FOUND_MESSAGE = "El proyecto no existe."


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
        project = self._get_project_or_raise(project_id)
        data = dict(data)
        imagen = data.pop("imagen", None)
        if data:
            project = self._repo.update(project_id, data)
        project = self._maybe_attach_image(project, imagen)
        return self._detail(project)

    def toggle_active(self, project_id: int) -> dict:
        project = self._get_project_or_raise(project_id)
        project = self._repo.update(project_id, {"activo": not project.activo})
        return self._detail(project)

    def delete_project(self, project_id: int) -> None:
        project = self._get_project_or_raise(project_id)
        self._delete_managed_file(project.imagen_url, f"gallery/{project_id}/")
        self._repo.delete(project_id)

    def _get_project_or_raise(self, project_id: int) -> Project:
        project = self._repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFound(PROJECT_NOT_FOUND_MESSAGE)
        return project

    # ── Image upload (Strategy via IStorageService) ────────────────────────────

    def _maybe_attach_image(self, project, imagen):
        if imagen is None or self._storage is None:
            return project
        filename = versioned_storage_filename(getattr(imagen, "name", "imagen"))
        path = f"gallery/{project.id}/{filename}"
        url = self._storage.upload(imagen, path)
        if not url:
            return project
        return self._repo.update(project.id, {"imagen_url": url})

    def _delete_managed_file(self, url: str, allowed_prefix: str) -> None:
        if self._storage is None:
            return
        path = managed_public_object_path(url, allowed_prefix)
        if path is not None:
            self._storage.delete(path)

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
