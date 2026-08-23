"""
End-to-end ticket lifecycle through TicketService (requires DB).
create → assign → update_status → close. Run: pytest apps/tickets/tests/test_ticket_lifecycle.py -v
"""

import pytest
from django.core import mail

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.notifications.models import Notification
from apps.tickets.models import Ticket, TicketEvent
from apps.tickets.services.ticket_service import TicketService, TicketValidationError
from core.exceptions.domain_exceptions import InvalidTransitionError
from core.testing import random_credential

# Generada por corrida (core.testing): sin credenciales hardcodeadas.
TEST_PASSWORD = random_credential()


@pytest.fixture
def service(db):
    return Service.objects.create(nombre="Soporte", descripcion="x", categoria="TI")


@pytest.fixture
def cliente(db):
    return User.objects.create_user(
        email="c@x.com",
        password=TEST_PASSWORD,
        role=User.Role.CLIENT,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
        ruc="0991234567001",
        empresa="Empresa Cliente",
    )


@pytest.fixture
def worker(db):
    return User.objects.create_user(email="w@x.com", password=TEST_PASSWORD, role=User.Role.WORKER,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


@pytest.fixture
def admin(db):
    return User.objects.create_user(email="a@x.com", password=TEST_PASSWORD, role=User.Role.ADMIN,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


@pytest.mark.django_db
class TestTicketLifecycle:
    def _create(self, cliente, service):
        svc = TicketService()
        data = {
            "asunto": "No imprime la factura",
            "descripcion": "La impresora no responde desde ayer por la tarde.",
            "servicio_id": service.id,
            "prioridad": "Alta",
            "adjuntos": [],
        }
        # El horario laboral es informativo (se maneja en la vista); el ticket se
        # crea 24/7, así que no hace falta parchear la hora.
        return svc.create_ticket(data, cliente)

    def test_create_generates_number_and_event(self, cliente, service):
        detail = self._create(cliente, service)
        assert detail["numero"].startswith("T-")
        assert detail["estado"] == "Nuevo"
        event = TicketEvent.objects.get(tipo_evento="creacion")
        assert event.autor_nombre == cliente.email

    def test_incomplete_existing_profile_cannot_create_ticket(self, cliente, service):
        cliente.ruc = ""
        cliente.empresa = ""
        cliente.save(update_fields=["ruc", "empresa"])
        with pytest.raises(TicketValidationError, match="Completa tu tipo") as error:
            self._create(cliente, service)
        assert error.value.field == "perfil"
        assert not Ticket.objects.exists()

    def test_full_flow_create_assign_resolve_close(self, cliente, service, worker, admin):
        detail = self._create(cliente, service)
        ticket_id = int(detail["id"])
        svc = TicketService()

        assigned = svc.assign_ticket(ticket_id, worker.id, admin)
        assert assigned["estado"] == "EnProceso"
        assert Ticket.objects.get(id=ticket_id).asignado_id == worker.id

        assignment_notifications = Notification.objects.filter(tipo="asignacion")
        assert set(assignment_notifications.values_list("usuario_id", flat=True)) == {
            cliente.id,
            worker.id,
            admin.id,
        }
        assignment_recipients = {
            address
            for message in mail.outbox
            if message.subject == f"[SassBlum] Ticket asignado · {detail['numero']}"
            for address in message.to
        }
        assert assignment_recipients == {cliente.email, worker.email, admin.email}

        resolved = svc.update_status(ticket_id, "Resuelto", "Listo.", worker)
        assert resolved["estado"] == "Resuelto"

        status_notifications = Notification.objects.filter(tipo="cambio_estado")
        assert set(status_notifications.values_list("usuario_id", flat=True)) == {
            cliente.id,
            worker.id,
            admin.id,
        }
        status_recipients = {
            address
            for message in mail.outbox
            if message.subject == f"[SassBlum] Ticket actualizado · {detail['numero']}"
            for address in message.to
        }
        assert status_recipients == {cliente.email, worker.email, admin.email}

        svc.add_comment(ticket_id, "Validación final completada.", worker)
        comment_notifications = Notification.objects.filter(tipo="comentario")
        assert set(comment_notifications.values_list("usuario_id", flat=True)) == {
            cliente.id,
            worker.id,
            admin.id,
        }
        comment_recipients = {
            address
            for message in mail.outbox
            if message.subject == (
                f"[SassBlum] Nuevo comentario en tu ticket · {detail['numero']}"
            )
            for address in message.to
        }
        assert comment_recipients == {cliente.email, worker.email, admin.email}

        closed = svc.close_ticket(ticket_id, "Confirmado por el cliente.", worker)
        assert closed["estado"] == "Cerrado"

    def test_ticket_email_uses_corrected_contact_without_changing_account(
        self, cliente, service, worker, admin
    ):
        detail = self._create(cliente, service)
        ticket_id = int(detail["id"])
        original_account_email = cliente.email
        svc = TicketService()
        svc.update_contact(
            ticket_id,
            {"nombre": "Contacto Corregido", "email": "correcto@example.com"},
            admin,
        )
        svc.assign_ticket(ticket_id, worker.id, admin)
        mail.outbox.clear()

        svc.add_comment(ticket_id, "Información adicional.", worker)

        ticket = Ticket.objects.get(id=ticket_id)
        cliente.refresh_from_db()
        client_messages = [
            message for message in mail.outbox
            if message.to == ["correcto@example.com"]
        ]
        assert len(client_messages) == 1
        assert original_account_email not in {
            address for message in mail.outbox for address in message.to
        }
        assert ticket.contacto_email_efectivo == "correcto@example.com"
        assert cliente.email == original_account_email

    def test_invalid_transition_raises(self, cliente, service, worker, admin):
        detail = self._create(cliente, service)
        ticket_id = int(detail["id"])
        svc = TicketService()
        # Nuevo → Resuelto is not allowed (must go through EnProceso first).
        # Use admin so _can_see() passes even though the ticket is unassigned.
        with pytest.raises(InvalidTransitionError):
            svc.update_status(ticket_id, "Resuelto", "comentario", admin)

    def test_number_format(self, cliente, service):
        assert TicketService().generate_ticket_number(2026).startswith("T-2026-")
