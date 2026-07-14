"""
End-to-end ticket lifecycle through TicketService (requires DB).
create → assign → update_status → close. Run: pytest apps/tickets/tests/test_ticket_lifecycle.py -v
"""

from core.testing import random_credential

import pytest

# Generada por corrida (core.testing): sin credenciales hardcodeadas.
TEST_PASSWORD = random_credential()

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent
from apps.tickets.services.ticket_service import TicketService
from core.exceptions.domain_exceptions import InvalidTransitionError


@pytest.fixture
def service(db):
    return Service.objects.create(nombre="Soporte", descripcion="x", categoria="TI")


@pytest.fixture
def cliente(db):
    return User.objects.create_user(email="c@x.com", password=TEST_PASSWORD, role=User.Role.CLIENT,
                                    estado=User.Estado.ACTIVE, email_verificado=True)


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
        assert TicketEvent.objects.filter(tipo_evento="creacion").count() == 1

    def test_full_flow_create_assign_resolve_close(self, cliente, service, worker, admin):
        detail = self._create(cliente, service)
        ticket_id = int(detail["id"])
        svc = TicketService()

        assigned = svc.assign_ticket(ticket_id, worker.id, admin)
        assert assigned["estado"] == "EnProceso"
        assert Ticket.objects.get(id=ticket_id).asignado_id == worker.id

        resolved = svc.update_status(ticket_id, "Resuelto", "Listo.", worker)
        assert resolved["estado"] == "Resuelto"

        closed = svc.close_ticket(ticket_id, "Confirmado por el cliente.", worker)
        assert closed["estado"] == "Cerrado"

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
