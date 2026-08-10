"""Regression tests for the ticket comment and state-change HTTP contract."""

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent


@pytest.fixture
def admin(db) -> User:
    return User.objects.create_user(
        email="admin-actions@test.com",
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )


@pytest.fixture
def worker(db) -> User:
    return User.objects.create_user(
        email="worker-actions@test.com",
        role=User.Role.WORKER,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )


@pytest.fixture
def ticket(db, worker) -> Ticket:
    cliente = User.objects.create_user(
        email="client-actions@test.com",
        role=User.Role.CLIENT,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )
    service = Service.objects.create(
        nombre="Soporte para pruebas de acciones",
        descripcion="Servicio de prueba para el contrato HTTP.",
        categoria="TI",
    )
    return Ticket.objects.create(
        numero="T-2026-9999",
        asunto="Ticket para probar acciones",
        descripcion="Descripción suficiente para una prueba de integración.",
        servicio=service,
        cliente=cliente,
        asignado=worker,
        estado=Ticket.Estado.EN_PROCESO,
    )


@pytest.mark.django_db
class TestTicketActionsAPI:
    def test_admin_can_change_ticket_status_at_registered_endpoint(self, admin, ticket) -> None:
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/estado",
            {"estado": Ticket.Estado.RESUELTO, "comentario": "Caso resuelto por administración."},
            format="json",
        )

        assert response.status_code == 200
        ticket.refresh_from_db()
        assert ticket.estado == Ticket.Estado.RESUELTO
        assert TicketEvent.objects.filter(
            ticket=ticket,
            tipo_evento=TicketEvent.TipoEvento.CAMBIO_ESTADO,
            autor=admin,
        ).exists()

    def test_admin_can_reopen_a_closed_ticket(self, admin, ticket) -> None:
        ticket.estado = Ticket.Estado.CERRADO
        ticket.save(update_fields=["estado"])
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/estado",
            {"estado": Ticket.Estado.EN_PROCESO, "comentario": "Ticket reabierto."},
            format="json",
        )

        assert response.status_code == 200
        ticket.refresh_from_db()
        assert ticket.estado == Ticket.Estado.EN_PROCESO

    def test_worker_can_skip_the_previous_sequential_flow(self, worker, ticket) -> None:
        ticket.estado = Ticket.Estado.EN_ESPERA
        ticket.save(update_fields=["estado"])
        client = APIClient()
        client.force_authenticate(user=worker)

        response = client.patch(
            f"/api/tickets/{ticket.id}/estado",
            {"estado": Ticket.Estado.CERRADO, "comentario": "Cierre operativo directo."},
            format="json",
        )

        assert response.status_code == 200
        ticket.refresh_from_db()
        assert ticket.estado == Ticket.Estado.CERRADO

    def test_admin_can_add_comment_at_registered_endpoint(self, admin, ticket) -> None:
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.post(
            f"/api/tickets/{ticket.id}/comentario",
            {"comentario": "Seguimiento registrado por administración."},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["tipo_evento"] == TicketEvent.TipoEvento.COMENTARIO
        assert response.data["autor_nombre"] == admin.email
        assert TicketEvent.objects.filter(
            ticket=ticket,
            tipo_evento=TicketEvent.TipoEvento.COMENTARIO,
            autor=admin,
        ).exists()
