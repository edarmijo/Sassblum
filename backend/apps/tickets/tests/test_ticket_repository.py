"""
Tests for TicketRepository — role-scoped listing, history ACL, duplicate detection.
Requires the database. Run: pytest apps/tickets/tests/test_ticket_repository.py -v
"""

import pytest

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket
from apps.tickets.repositories import TicketRepository


@pytest.fixture
def service(db):
    return Service.objects.create(nombre="Soporte", descripcion="x", categoria="TI")


@pytest.fixture
def cliente(db):
    return User.objects.create_user(email="c@x.com", password="p", role=User.Role.CLIENT)


@pytest.fixture
def worker(db):
    return User.objects.create_user(email="w@x.com", password="p", role=User.Role.WORKER)


@pytest.fixture
def admin(db):
    return User.objects.create_user(email="a@x.com", password="p", role=User.Role.ADMIN)


def make_ticket(numero, servicio, cliente, asignado=None, estado="Nuevo", asunto="Asunto X"):
    return Ticket.objects.create(
        numero=numero, asunto=asunto, descripcion="desc larga aquí",
        servicio=servicio, cliente=cliente, asignado=asignado, estado=estado,
    )


@pytest.mark.django_db
class TestRoleScopedListing:
    def test_client_sees_only_own(self, service, cliente, worker, admin):
        otro = User.objects.create_user(email="o@x.com", password="p", role=User.Role.CLIENT)
        make_ticket("T-2026-0001", service, cliente)
        make_ticket("T-2026-0002", service, otro)

        result = TicketRepository().get_all_for_user(cliente)
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0001"}

    def test_worker_sees_only_assigned(self, service, cliente, worker):
        make_ticket("T-2026-0003", service, cliente, asignado=worker, estado="EnProceso")
        make_ticket("T-2026-0004", service, cliente)  # unassigned

        result = TicketRepository().get_all_for_user(worker)
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0003"}

    def test_admin_sees_all(self, service, cliente, worker, admin):
        make_ticket("T-2026-0005", service, cliente)
        make_ticket("T-2026-0006", service, cliente, asignado=worker, estado="EnProceso")
        result = TicketRepository().get_all_for_user(admin)
        assert result["total"] == 2

    def test_filter_by_estado(self, service, cliente, admin):
        make_ticket("T-2026-0007", service, cliente, estado="Nuevo")
        make_ticket("T-2026-0008", service, cliente, estado="Resuelto")
        result = TicketRepository().get_all_for_user(admin, {"estado": "Resuelto"})
        numeros = {t.numero for t in result["items"]}
        assert numeros == {"T-2026-0008"}


@pytest.mark.django_db
class TestDuplicateDetection:
    def test_finds_active_duplicate(self, service, cliente):
        make_ticket("T-2026-0009", service, cliente, asunto="Impresora rota", estado="Nuevo")
        dup = TicketRepository().find_active_duplicate(cliente.id, "Impresora rota", service.id)
        assert dup is not None

    def test_closed_ticket_is_not_duplicate(self, service, cliente):
        make_ticket("T-2026-0010", service, cliente, asunto="Mouse roto", estado="Cerrado")
        dup = TicketRepository().find_active_duplicate(cliente.id, "Mouse roto", service.id)
        assert dup is None


@pytest.mark.django_db
class TestHistoryAccessControl:
    def test_other_client_cannot_see_history(self, service, cliente):
        otro = User.objects.create_user(email="z@x.com", password="p", role=User.Role.CLIENT)
        ticket = make_ticket("T-2026-0011", service, cliente)
        assert TicketRepository().get_history(ticket.id, otro) is None

    def test_owner_can_see_history(self, service, cliente):
        ticket = make_ticket("T-2026-0012", service, cliente)
        assert TicketRepository().get_history(ticket.id, cliente) == []
