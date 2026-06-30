"""
ServiceRepository — ORM gateway for catalog Service (Repository).
SOLID: DIP · SRP · LSP. CatalogService depends on this, never on the ORM directly.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.catalog.models import Service


class ServiceRepository(BaseRepository[Service]):

    def get_by_id(self, entity_id: int) -> Optional[Service]:
        return Service.objects.filter(pk=entity_id).first()

    def get_all(self, filters: dict | None = None) -> list[Service]:
        qs = Service.objects.all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Service:
        return Service.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Service:
        Service.objects.filter(pk=entity_id).update(**data)
        return Service.objects.get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Service.objects.filter(pk=entity_id).delete()

    # ── Catalog-specific ───────────────────────────────────────────────────────

    def get_active(
        self, categoria: str | None = None, busqueda: str | None = None
    ) -> list[Service]:
        qs = Service.objects.filter(activo=True)
        if categoria:
            qs = qs.filter(categoria__iexact=categoria)
        if busqueda:
            qs = qs.filter(nombre__icontains=busqueda)
        return list(qs)
