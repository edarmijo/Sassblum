"""
ProjectRepository — ORM gateway for gallery Project (Repository).
SOLID: DIP · SRP · LSP. GalleryService depends on this, never on the ORM directly.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.gallery.models import Project


class ProjectRepository(BaseRepository[Project]):

    def get_by_id(self, entity_id: int) -> Optional[Project]:
        return Project.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Project]:
        qs = Project.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Project:
        return Project.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Project:
        Project.objects.filter(pk=entity_id).update(**data)
        return Project.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Project.objects.filter(pk=entity_id).delete()

    # ── Gallery-specific ───────────────────────────────────────────────────────

    def get_active(self) -> list[Project]:
        return list(Project.objects.filter(activo=True))
