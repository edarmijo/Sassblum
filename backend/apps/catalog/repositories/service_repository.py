"""
ServiceRepository — ORM gateway for catalog Service and ServiceImage (Repository).
SOLID: DIP · SRP · LSP. CatalogService depends on this, never on the ORM directly.
"""

from __future__ import annotations

from typing import Optional

from core.base.base_repository import BaseRepository
from apps.catalog.models import Service, ServiceImage


class ServiceRepository(BaseRepository[Service]):

    def get_by_id(self, entity_id: int) -> Optional[Service]:
        return Service.objects.filter(pk=entity_id).prefetch_related('imagenes').first()

    def get_all(self, filters: dict | None = None) -> list[Service]:
        qs = Service.objects.prefetch_related('imagenes').all()
        if filters:
            qs = qs.filter(**filters)
        return list(qs)

    def create(self, data: dict) -> Service:
        return Service.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Service:
        Service.objects.filter(pk=entity_id).update(**data)
        return Service.objects.prefetch_related('imagenes').get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Service.objects.filter(pk=entity_id).delete()

    # ── Catalog-specific ───────────────────────────────────────────────────────

    def get_active(
        self, categoria: str | None = None, busqueda: str | None = None
    ) -> list[Service]:
        qs = Service.objects.filter(activo=True).prefetch_related('imagenes')
        if categoria:
            qs = qs.filter(categoria__iexact=categoria)
        if busqueda:
            qs = qs.filter(nombre__icontains=busqueda)
        return list(qs)

    # ── Gallery image methods ──────────────────────────────────────────────────

    def add_image(self, service_id: int, imagen_url: str, orden: int) -> ServiceImage:
        return ServiceImage.objects.create(
            servicio_id=service_id, imagen_url=imagen_url, orden=orden
        )

    def delete_image(self, image_id: int) -> None:
        ServiceImage.objects.filter(pk=image_id).delete()

    def get_image_by_id(self, image_id: int) -> Optional[ServiceImage]:
        return ServiceImage.objects.filter(pk=image_id).select_related('servicio').first()

    def get_next_order(self, service_id: int) -> int:
        last = ServiceImage.objects.filter(servicio_id=service_id).order_by('-orden').first()
        return (last.orden + 1) if last else 0
