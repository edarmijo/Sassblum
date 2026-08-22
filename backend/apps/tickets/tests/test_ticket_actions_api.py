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
def replacement_worker(db) -> User:
    return User.objects.create_user(
        email="replacement-worker-actions@test.com",
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
    def test_admin_initial_assignment_moves_new_ticket_to_in_progress(
        self, admin, ticket, replacement_worker
    ) -> None:
        ticket.asignado = None
        ticket.estado = Ticket.Estado.NUEVO
        ticket.save(update_fields=["asignado", "estado"])
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/asignar",
            {"worker_id": replacement_worker.id},
            format="json",
        )

        assert response.status_code == 200
        ticket.refresh_from_db()
        assert ticket.asignado_id == replacement_worker.id
        assert ticket.estado == Ticket.Estado.EN_PROCESO
        assert TicketEvent.objects.filter(
            ticket=ticket,
            tipo_evento=TicketEvent.TipoEvento.ASIGNACION,
            estado_anterior=Ticket.Estado.NUEVO,
            estado_nuevo=Ticket.Estado.EN_PROCESO,
            autor=admin,
        ).exists()

    @pytest.mark.parametrize(
        "current_status",
        [
            Ticket.Estado.EN_PROCESO,
            Ticket.Estado.EN_ESPERA,
            Ticket.Estado.RESUELTO,
            Ticket.Estado.CERRADO,
        ],
    )
    def test_admin_reassignment_only_changes_the_worker(
        self, admin, ticket, replacement_worker, current_status
    ) -> None:
        previous_worker_id = ticket.asignado_id
        ticket.estado = current_status
        ticket.save(update_fields=["estado"])
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/reasignar",
            {"worker_id": replacement_worker.id},
            format="json",
        )

        assert response.status_code == 200
        ticket.refresh_from_db()
        assert ticket.asignado_id == replacement_worker.id
        assert ticket.estado == current_status
        event = TicketEvent.objects.get(
            ticket=ticket,
            tipo_evento=TicketEvent.TipoEvento.REASIGNACION,
            autor=admin,
        )
        assert event.estado_anterior == ""
        assert event.estado_nuevo == ""
        assert event.asignado_anterior_id == previous_worker_id

    def test_initial_assignment_rejects_a_ticket_that_already_has_a_worker(
        self, admin, ticket, replacement_worker
    ) -> None:
        ticket.estado = Ticket.Estado.NUEVO
        ticket.save(update_fields=["estado"])
        original_worker_id = ticket.asignado_id
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/asignar",
            {"worker_id": replacement_worker.id},
            format="json",
        )

        assert response.status_code == 400
        ticket.refresh_from_db()
        assert ticket.asignado_id == original_worker_id
        assert ticket.estado == Ticket.Estado.NUEVO
        assert not TicketEvent.objects.filter(ticket=ticket).exists()

    def test_reassignment_rejects_a_new_unassigned_ticket(
        self, admin, ticket, replacement_worker
    ) -> None:
        ticket.asignado = None
        ticket.estado = Ticket.Estado.NUEVO
        ticket.save(update_fields=["asignado", "estado"])
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/reasignar",
            {"worker_id": replacement_worker.id},
            format="json",
        )

        assert response.status_code == 400
        ticket.refresh_from_db()
        assert ticket.asignado_id is None
        assert ticket.estado == Ticket.Estado.NUEVO
        assert not TicketEvent.objects.filter(ticket=ticket).exists()

    def test_reassignment_rejects_the_current_worker(self, admin, ticket) -> None:
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/reasignar",
            {"worker_id": ticket.asignado_id},
            format="json",
        )

        assert response.status_code == 400
        assert not TicketEvent.objects.filter(ticket=ticket).exists()

    def test_status_endpoint_cannot_bypass_initial_assignment(self, admin, ticket) -> None:
        ticket.asignado = None
        ticket.estado = Ticket.Estado.NUEVO
        ticket.save(update_fields=["asignado", "estado"])
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/estado",
            {
                "estado": Ticket.Estado.EN_PROCESO,
                "comentario": "Intento de omitir la asignación.",
            },
            format="json",
        )

        assert response.status_code == 400
        ticket.refresh_from_db()
        assert ticket.estado == Ticket.Estado.NUEVO
        assert not TicketEvent.objects.filter(ticket=ticket).exists()

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

    def test_admin_corrects_ticket_contact_without_changing_login_email(
        self, admin, ticket
    ) -> None:
        original_account_email = ticket.cliente.email
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f"/api/tickets/{ticket.id}/contacto",
            {"nombre": "Contacto Corregido", "email": "Correcto@Example.COM"},
            format="json",
        )

        assert response.status_code == 200
        ticket.refresh_from_db()
        ticket.cliente.refresh_from_db()
        assert ticket.contacto_nombre == "Contacto Corregido"
        assert ticket.contacto_email == "correcto@example.com"
        assert ticket.cliente.email == original_account_email
        assert response.data["cliente_nombre"] == "Contacto Corregido"
        assert response.data["cliente_email"] == "correcto@example.com"
        event = TicketEvent.objects.get(
            ticket=ticket,
            tipo_evento=TicketEvent.TipoEvento.CONTACTO_ACTUALIZADO,
        )
        assert event.autor == admin
        assert original_account_email in event.comentario
        assert "correcto@example.com" in event.comentario

    def test_only_admin_can_correct_ticket_contact(
        self, worker, ticket
    ) -> None:
        client = APIClient()
        for actor in (worker, ticket.cliente):
            client.force_authenticate(user=actor)
            response = client.patch(
                f"/api/tickets/{ticket.id}/contacto",
                {"nombre": "Intento no autorizado"},
                format="json",
            )
            assert response.status_code == 403
        assert not TicketEvent.objects.filter(
            ticket=ticket,
            tipo_evento=TicketEvent.TipoEvento.CONTACTO_ACTUALIZADO,
        ).exists()

    def test_contact_correction_validates_email_and_requires_a_change(
        self, admin, ticket
    ) -> None:
        client = APIClient()
        client.force_authenticate(user=admin)

        invalid = client.patch(
            f"/api/tickets/{ticket.id}/contacto",
            {"email": "correo-invalido"},
            format="json",
        )
        unchanged = client.patch(
            f"/api/tickets/{ticket.id}/contacto",
            {"email": ticket.cliente.email},
            format="json",
        )

        assert invalid.status_code == 400
        assert unchanged.status_code == 400
        assert not TicketEvent.objects.filter(
            ticket=ticket,
            tipo_evento=TicketEvent.TipoEvento.CONTACTO_ACTUALIZADO,
        ).exists()
