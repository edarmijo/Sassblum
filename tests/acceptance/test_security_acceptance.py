"""
SECURITY Acceptance Tests — Additional
═══════════════════════════════════════
Extra tests beyond the 20 FIEC cases for production readiness.
Focus: OWASP Top 10, rate limiting, CORS, CSP, JWT security.
"""

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from helpers import SQLI_PAYLOAD, TEST_PASSWORD, WRONG_PASSWORD


@pytest.mark.django_db
class TestSecurity:
    """Security acceptance tests for production deployment."""

    def test_unauthenticated_access_rejected(self, api_client):
        """Protected endpoints must reject unauthenticated requests."""
        endpoints = ['/api/tickets/', '/api/notificaciones/', '/api/reportes/tickets']
        for endpoint in endpoints:
            response = api_client.get(endpoint)
            assert response.status_code == 401, f"{endpoint} should reject unauth access"

    def test_health_check_public(self, api_client):
        """Health check endpoint should be publicly accessible."""
        response = api_client.get('/health/')
        assert response.status_code == 200
        assert response.json().get('status') == 'healthy'

    @override_settings(CORS_ALLOWED_ORIGINS=['http://localhost:5173'])
    def test_cors_headers_present(self, api_client):
        """CORS headers should be configured."""
        response = api_client.options('/api/servicios/', HTTP_ORIGIN='http://localhost:5173')
        assert response.status_code == 200
        assert response['Access-Control-Allow-Origin'] == 'http://localhost:5173'

    def test_sql_injection_protection(self, api_client):
        """SQL injection attempts should be handled safely."""
        response = api_client.post('/api/auth/login', {
            "email": SQLI_PAYLOAD,
            "password": SQLI_PAYLOAD,
        })
        assert response.status_code in (400, 401)

    def test_xss_in_ticket_subject(self, authenticated_client, catalog_service):
        """HTML-like input remains inert JSON data for the React rendering boundary."""
        response = authenticated_client.post('/api/tickets/', {
            'asunto': '<script>alert("xss")</script>',
            'descripcion': 'Test XSS protection in the ticket description field',
            'servicio_id': catalog_service.id,
            'prioridad': 'Media',
        })
        assert response.status_code == 201
        assert response['Content-Type'].startswith('application/json')
        assert response.data['asunto'] == '<script>alert("xss")</script>'

    def test_password_not_returned_in_response(self, api_client, client_user):
        """Password hash should never appear in API responses."""
        response = api_client.post('/api/auth/login', {
            'email': client_user.email,
            'password': TEST_PASSWORD,
        })
        assert response.status_code == 200
        response_str = str(response.data)
        assert TEST_PASSWORD not in response_str
        assert 'password' not in response_str.lower()

    def test_rate_limiting_on_login(self, api_client, client_user):
        """Rate limiting should protect login endpoint."""
        responses = []
        for _ in range(35):
            resp = api_client.post('/api/auth/login', {
                'email': client_user.email,
                'password': WRONG_PASSWORD,
            })
            responses.append(resp.status_code)
        assert 429 in responses

    def test_admin_required_for_admin_endpoints(self, authenticated_client):
        """Admin-only endpoints should reject client users."""
        admin_endpoints = [
            '/api/reportes/tickets',
            '/api/usuarios/',
        ]
        for endpoint in admin_endpoints:
            response = authenticated_client.get(endpoint)
            assert response.status_code == 403, f"{endpoint} should require admin"
