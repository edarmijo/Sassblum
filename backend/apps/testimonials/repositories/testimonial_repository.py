"""ORM gateway for customer testimonials (Repository pattern)."""

from __future__ import annotations

from typing import Optional

from apps.authentication.models import User
from apps.testimonials.models import Testimonial
from core.base.base_repository import BaseRepository


class TestimonialRepository(BaseRepository[Testimonial]):
    """The only layer allowed to query the Testimonial model."""

    def get_by_id(self, entity_id: int) -> Optional[Testimonial]:
        return Testimonial.objects.select_related("cliente").filter(pk=entity_id).first()

    def get_by_client(self, client: User) -> Optional[Testimonial]:
        return Testimonial.objects.select_related("cliente").filter(cliente=client).first()

    def get_all(self, filters: dict | None = None) -> list[Testimonial]:
        queryset = Testimonial.objects.select_related("cliente")
        if filters:
            queryset = queryset.filter(**filters)
        return list(queryset)

    def get_approved(self, *, limit: int = 12) -> list[Testimonial]:
        return list(
            Testimonial.objects.select_related("cliente")
            .filter(
                estado=Testimonial.Status.APPROVED,
                cliente__estado=User.Estado.ACTIVE,
            )
            .order_by("-moderado_en", "-created_at")[:limit]
        )

    def create(self, data: dict) -> Testimonial:
        return Testimonial.objects.create(**data)

    def update(self, entity_id: int, data: dict) -> Testimonial:
        Testimonial.objects.filter(pk=entity_id).update(**data)
        return Testimonial.objects.select_related("cliente").get(pk=entity_id)

    def delete(self, entity_id: int) -> None:
        Testimonial.objects.filter(pk=entity_id).delete()
