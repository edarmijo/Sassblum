"""
Integration tests for the Ticket API — H#9 (audit).

Tests HTTP endpoints using DRF APIClient (not mocked).
Verifies authentication, permissions, serialization, and response codes.

Run: pytest apps/tickets/tests/test_ticket_api.py -v
"""

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestTicketAPIIntegration:
    """H#9: Integration tests using DRF APIClient."""

    def test_list_tickets_unauthenticated_returns_401(self):
        """Unauthenticated requests should be rejected."""
        client = APIClient()
        response = client.get('/api/tickets/')
        assert response.status_code == 401

    def test_health_check_returns_200(self):
        """H#25: Health check endpoint should be accessible without auth."""
        client = APIClient()
        response = client.get('/health/')
        assert response.status_code == 200
        assert response.json()['status'] == 'healthy'

    def test_services_list_public(self):
        """Service catalog should be publicly accessible."""
        client = APIClient()
        response = client.get('/api/servicios/')
        assert response.status_code == 200
        assert 'items' in response.data

    def test_create_ticket_unauthenticated_returns_401(self):
        """Ticket creation should require authentication."""
        client = APIClient()
        response = client.post('/api/tickets/', {
            'asunto': 'Test',
            'descripcion': 'Test description',
            'servicio_id': 1,
            'prioridad': 'Media',
        })
        assert response.status_code == 401

    def test_create_ticket_as_worker_returns_403(self):
        """LN-1 + requirement: only CLIENT role can create tickets (IsClient)."""
        from apps.authentication.models import User
        worker = User.objects.create_user(
            email='worker@test.com', password='Secure123!',
            role=User.Role.WORKER, estado=User.Estado.ACTIVE, email_verificado=True,
        )
        client = APIClient()
        client.force_authenticate(user=worker)
        response = cl