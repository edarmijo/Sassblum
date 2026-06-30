TEST_PASSWORD = 'TestPass123!'
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
