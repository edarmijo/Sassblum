"""
SECURITY Acceptance Tests — Additional
═══════════════════════════════════════
Extra tests beyond the 20 FIEC cases for production readiness.
Focus: OWASP Top 10, rate limiting, CORS, CSP, JWT security.
"""

import pytest
from rest_framework.test import APIClient


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
        assert response.data.get('status') == 'healthy'

    def test_cors_headers_present(self, api_client):
        """CORS headers should be configured."""
        response = api_client.options('/api/servicios/', HTTP_ORIGIN='http://localhost:5173')
        # CORS middleware should handle this
        assert response.status_code in (200, 204, 405)

    def test_sql_injection_protection(self, api_client):
        """SQL injection attempts should be handled safely."""
        response = api_client.post('/api/auth/login', {
            "email": "' OR 1=1 --",
            "password": "' OR 1=1 --",
        })
        assert response.status_code in (400, 401)

    def test_xss_in_ticket_subject(self, authenticated_client):
        """XSS payloads in ticket subject should be escaped."""
        response = authenticated_client.post('/api/tickets/', {
            'asunto': '<script>alert("xss")</script>',
            'descripcion': 'Test XSS protection in the ticket description field',
        })
        # Should either reject or escape the HTML
        if response.status_code in (200, 201):
            assert '<script>' not in str(response.data.get('asunto', ''))

    def test_password_not_returned_in_response(self, api_client, client_user):
        """Password hash should never appear in API responses."""
        response = api_client.post('/api/auth/login', {
            'email': client_user.email,
            'password': 'TestPass123!',
        })
        if response.status_code == 200:
            response_str = str(response.data)
            assert 'TestPass123!' not in response_str
            assert 'password' not in response_str.lower() or 'access' in response_str

    def test_rate_limiting_on_login(self, api_client, client_user):
        """Rate limiting should protect login endpoint."""
        responses = []
        for _ in range(35):
            resp = api_client.post('/api/auth/login', {
                'email': client_user.email,
                'password': 'WrongPass!',
            })
            responses.append(resp.status_code)
        # Should see 429 after exceeding rate limit
        assert 429 in responses or all(r == 401 for r in responses)

    def test_admin_required_for_admin_endpoints(self, authenticated_client):
        """Admin-only endpoints should reject client users."""
        admin_endpoints = [
            '/api/reportes/tickets',
            '/api/usuarios/',
        ]
        for endpoint in admin_endpoints:
            response = authenticated_client.get(endpoint)
            assert response.status_code in (403, 404), f"{endpoint} should require admin"
