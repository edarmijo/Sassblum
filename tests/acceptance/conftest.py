"""
Acceptance Test Suite — SassBlum Ticket Management System
═══════════════════════════════════════════════════════════

Based on: Template FIEC — 20 acceptance test cases (TC-C1..TC-C8, TC-W1..TC-W6, TC-A1..TC-A6)
Extended with additional integration tests for production readiness.

Run all:  pytest tests/acceptance/ -v
Run role: pytest tests/acceptance/ -v -k "client"
          pytest tests/acceptance/ -v -k "worker"
          pytest tests/acceptance/ -v -k "admin"
"""

import pytest
from rest_framework.test import APIClient
from apps.authentication.models import User

from helpers import TEST_PASSWORD


@pytest.fixture(autouse=True)
def _disable_ssl_redirect(settings):
    """Tests must not depend on the .env DJANGO_DEBUG value (301 → https)."""
    settings.SECURE_SSL_REDIRECT = False


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """DRF throttling persists in the cache across tests; without this, the
    rate-limiting test poisons every login test that runs after it (429)."""
    from django.core.cache import cache
    cache.clear()


@pytest.fixture
def catalog_service(db):
    """An active catalog service — required FK for ticket creation."""
    from apps.catalog.models import Service
    return Service.objects.create(
        nombre='Soporte Técnico', descripcion='Soporte de aceptación',
        categoria='Soporte', activo=True,
    )


@pytest.fixture
def api_client():
    """Unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def client_user(db):
    """A verified client user."""
    user = User.objects.create_user(
        email='cliente@sassblum.com',
        password=TEST_PASSWORD,
        first_name='Cliente',
        last_name='Test',
        tipo_identificacion=User.TipoIdentificacion.RUC,
        ruc='0991234567001',
        empresa='Empresa Cliente',
        role=User.Role.CLIENT,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )
    return user


@pytest.fixture
def worker_user(db):
    """An active worker user."""
    user = User.objects.create_user(
        email='trabajador1@sassblum.com',
        password=TEST_PASSWORD,
        first_name='Carlos',
        last_name='Técnico',
        role=User.Role.WORKER,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )
    return user


@pytest.fixture
def second_worker_user(db):
    """A second active worker for reassignment scenarios."""
    return User.objects.create_user(
        email='trabajador2@sassblum.com',
        password=TEST_PASSWORD,
        first_name='Ana',
        last_name='Soporte',
        role=User.Role.WORKER,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )


@pytest.fixture
def admin_user(db):
    """An admin user."""
    user = User.objects.create_user(
        email='admin@sassblum.com',
        password=TEST_PASSWORD,
        first_name='Admin',
        last_name='SassBlum',
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
        is_staff=True,
    )
    return user


@pytest.fixture
def authenticated_client(api_client, client_user):
    """DRF client authenticated as client."""
    api_client.force_authenticate(user=client_user)
    return api_client


@pytest.fixture
def authenticated_worker(api_client, worker_user):
    """DRF client authenticated as worker."""
    api_client.force_authenticate(user=worker_user)
    return api_client


@pytest.fixture
def authenticated_admin(api_client, admin_user):
    """DRF client authenticated as admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client


def _ticket(*, numero, catalog_service, client_user, estado, worker_user=None):
    """Create an isolated acceptance ticket with an explicit lifecycle state."""
    from apps.tickets.models import Ticket
    return Ticket.objects.create(
        numero=numero,
        asunto='Ticket de aceptación',
        descripcion='Dato aislado para una prueba de aceptación reproducible.',
        servicio=catalog_service,
        cliente=client_user,
        asignado=worker_user,
        estado=estado,
        prioridad=Ticket.Prioridad.ALTA,
    )


@pytest.fixture
def new_ticket(catalog_service, client_user):
    from apps.tickets.models import Ticket
    return _ticket(
        numero='T-2026-9101', catalog_service=catalog_service,
        client_user=client_user, estado=Ticket.Estado.NUEVO,
    )


@pytest.fixture
def in_progress_ticket(catalog_service, client_user, worker_user):
    from apps.tickets.models import Ticket
    return _ticket(
        numero='T-2026-9102', catalog_service=catalog_service,
        client_user=client_user, worker_user=worker_user,
        estado=Ticket.Estado.EN_PROCESO,
    )


@pytest.fixture
def resolved_ticket(catalog_service, client_user, worker_user):
    from apps.tickets.models import Ticket
    return _ticket(
        numero='T-2026-9103', catalog_service=catalog_service,
        client_user=client_user, worker_user=worker_user,
        estado=Ticket.Estado.RESUELTO,
    )


@pytest.fixture
def closed_ticket(catalog_service, client_user, worker_user):
    from apps.tickets.models import Ticket
    return _ticket(
        numero='T-2026-9104', catalog_service=catalog_service,
        client_user=client_user, worker_user=worker_user,
        estado=Ticket.Estado.CERRADO,
    )
