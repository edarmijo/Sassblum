"""Integration coverage for testimonial ownership, moderation, and publication."""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.testimonials.models import Testimonial as _Testimonial


def _user(email: str, role: str) -> User:
    return User.objects.create_user(
        email=email,
        role=role,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
        first_name="María",
        last_name="Vélez",
        empresa="Empresa Ecuador",
    )


def _authenticated(user: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestTestimonialApi:
    def test_client_can_create_one_testimonial_and_edit_returns_it_to_pending(self) -> None:
        customer = _user("cliente-testimonio@example.com", User.Role.CLIENT)
        client = _authenticated(customer)

        created = client.post(
            "/api/testimonios/mi-testimonio/",
            {"calificacion": 5, "comentario": "El soporte fue rápido, claro y muy profesional."},
            format="json",
        )

        assert created.status_code == 201
        assert created.data["estado"] == _Testimonial.Status.PENDING
        duplicate = client.post(
            "/api/testimonios/mi-testimonio/",
            {"calificacion": 4, "comentario": "Intento de crear un segundo testimonio válido."},
            format="json",
        )
        assert duplicate.status_code == 409

        testimonial = _Testimonial.objects.get(cliente=customer)
        testimonial.estado = _Testimonial.Status.APPROVED
        testimonial.save(update_fields=["estado"])
        edited = client.patch(
            "/api/testimonios/mi-testimonio/",
            {"calificacion": 4, "comentario": "Actualicé mi experiencia después de una nueva visita."},
            format="json",
        )

        assert edited.status_code == 200
        assert edited.data["estado"] == _Testimonial.Status.PENDING

    def test_public_endpoint_only_exposes_approved_content(self) -> None:
        approved_user = _user("publicado@example.com", User.Role.CLIENT)
        pending_user = _user("pendiente@example.com", User.Role.CLIENT)
        _Testimonial.objects.create(
            cliente=approved_user,
            calificacion=5,
            comentario="Una experiencia publicada y visible para todos.",
            estado=_Testimonial.Status.APPROVED,
        )
        _Testimonial.objects.create(
            cliente=pending_user,
            calificacion=3,
            comentario="Este contenido todavía espera moderación.",
        )

        response = APIClient().get("/api/testimonios/")

        assert response.status_code == 200
        assert response.data["total"] == 1
        assert response.data["items"][0]["autor"] == "María Vélez"
        assert "estado" not in response.data["items"][0]
        assert response["Cache-Control"].startswith("public")

    def test_only_admin_can_moderate_and_rejection_requires_a_note(self) -> None:
        customer = _user("moderado@example.com", User.Role.CLIENT)
        worker = _user("worker-moderacion@example.com", User.Role.WORKER)
        admin = _user("admin-moderacion@example.com", User.Role.ADMIN)
        item = _Testimonial.objects.create(
            cliente=customer,
            calificacion=2,
            comentario="Necesito explicar con más detalle mi experiencia.",
        )

        forbidden = _authenticated(worker).patch(
            f"/api/testimonios/admin/{item.id}/",
            {"estado": _Testimonial.Status.APPROVED},
            format="json",
        )
        missing_note = _authenticated(admin).patch(
            f"/api/testimonios/admin/{item.id}/",
            {"estado": _Testimonial.Status.REJECTED},
            format="json",
        )
        approved = _authenticated(admin).patch(
            f"/api/testimonios/admin/{item.id}/",
            {"estado": _Testimonial.Status.APPROVED},
            format="json",
        )

        assert forbidden.status_code == 403
        assert missing_note.status_code == 400
        assert approved.status_code == 200
        assert approved.data["estado"] == _Testimonial.Status.APPROVED

    def test_client_can_delete_owned_testimonial(self) -> None:
        customer = _user("borrar-testimonio@example.com", User.Role.CLIENT)
        _Testimonial.objects.create(
            cliente=customer,
            calificacion=5,
            comentario="Testimonio que el cliente ha decidido retirar.",
        )

        response = _authenticated(customer).delete("/api/testimonios/mi-testimonio/")

        assert response.status_code == 204
        assert not _Testimonial.objects.filter(cliente=customer).exists()
