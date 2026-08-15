"""Business rules for customer testimony and publication moderation."""

from __future__ import annotations

import threading

from django.db import IntegrityError
from django.utils import timezone

from apps.authentication.models import User
from apps.testimonials.interfaces import (
    ITestimonialAdminActions,
    ITestimonialClientActions,
    ITestimonialPublicView,
)
from apps.testimonials.models import Testimonial
from apps.testimonials.repositories import TestimonialRepository
from core.exceptions.domain_exceptions import DomainException


class TestimonialNotFound(DomainException):
    """Raised when the requested testimonial does not exist."""


class DuplicateTestimonial(DomainException):
    """Raised when a customer attempts to create a second testimonial."""


class TestimonialService(
    ITestimonialPublicView,
    ITestimonialClientActions,
    ITestimonialAdminActions,
):
    """Coordinates client ownership and the moderation state machine."""

    def __init__(self, repository: TestimonialRepository | None = None) -> None:
        self._repo = repository or TestimonialRepository()

    def list_approved(self) -> list[dict]:
        return [self._public_item(item) for item in self._repo.get_approved(limit=12)]

    def get_for_client(self, client: User) -> dict | None:
        item = self._repo.get_by_client(client)
        return self._client_item(item) if item else None

    def create_for_client(self, client: User, data: dict) -> dict:
        if self._repo.get_by_client(client) is not None:
            raise DuplicateTestimonial("Ya tienes un testimonio. Puedes editarlo desde esta misma sección.")
        try:
            item = self._repo.create(
                {
                    "cliente": client,
                    "calificacion": data["calificacion"],
                    "comentario": data["comentario"].strip(),
                }
            )
        except IntegrityError as exc:
            # The OneToOne constraint is the final guard when two tabs submit
            # simultaneously after both observed an empty state.
            raise DuplicateTestimonial(
                "Ya tienes un testimonio. Puedes editarlo desde esta misma sección."
            ) from exc
        return self._client_item(item)

    def update_for_client(self, client: User, data: dict) -> dict:
        item = self._repo.get_by_client(client)
        if item is None:
            raise TestimonialNotFound("Aún no has creado un testimonio.")
        payload = {
            **data,
            "comentario": data["comentario"].strip(),
            "estado": Testimonial.Status.PENDING,
            "nota_moderacion": "",
            "moderado_por": None,
            "moderado_en": None,
        }
        return self._client_item(self._repo.update(item.id, payload))

    def delete_for_client(self, client: User) -> None:
        item = self._repo.get_by_client(client)
        if item is None:
            raise TestimonialNotFound("Aún no has creado un testimonio.")
        self._repo.delete(item.id)

    def list_for_moderation(self) -> list[dict]:
        return [self._admin_item(item) for item in self._repo.get_all()]

    def moderate(self, testimonial_id: int, moderator: User, data: dict) -> dict:
        item = self._repo.get_by_id(testimonial_id)
        if item is None:
            raise TestimonialNotFound("El testimonio no existe.")
        updated = self._repo.update(
            testimonial_id,
            {
                "estado": data["estado"],
                "nota_moderacion": data.get("nota_moderacion", "").strip(),
                "moderado_por": moderator,
                "moderado_en": timezone.now(),
            },
        )
        return self._admin_item(updated)

    @staticmethod
    def _author(item: Testimonial) -> str:
        return item.cliente.get_full_name().strip() or item.cliente.email.split("@", 1)[0]

    @classmethod
    def _public_item(cls, item: Testimonial) -> dict:
        return {
            "id": item.id,
            "autor": cls._author(item),
            "empresa": item.cliente.empresa.strip() or "Cliente SassBlum",
            "calificacion": item.calificacion,
            "comentario": item.comentario,
            "publicado_en": (item.moderado_en or item.created_at).isoformat(),
        }

    @classmethod
    def _client_item(cls, item: Testimonial) -> dict:
        return {
            **cls._public_item(item),
            "estado": item.estado,
            "nota_moderacion": item.nota_moderacion,
            "actualizado_en": item.updated_at.isoformat(),
        }

    @classmethod
    def _admin_item(cls, item: Testimonial) -> dict:
        return {
            **cls._client_item(item),
            "cliente_email": item.cliente.email,
        }


_lock = threading.Lock()
_instance: TestimonialService | None = None


def get_testimonial_service() -> TestimonialService:
    """Return the thread-safe testimonial service singleton."""
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = TestimonialService()
    return _instance
