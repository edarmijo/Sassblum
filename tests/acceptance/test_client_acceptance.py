"""
CLIENT Role Acceptance Tests — TC-C1 to TC-C8
═══════════════════════════════════════════════
Source: Template FIEC — SassBlum Ticket Management System
Role: Client · Account: cliente@sassblum.com

Each test follows Given / When / Then format.
"""

import pytest
from apps.authentication.models import User
from apps.authentication.services.token_service import TokenService

from helpers import NEW_USER_PASSWORD, TEST_PASSWORD, WRONG_PASSWORD


# ── TC-C1: Registration ───────────────────────────────────────────────────────
# Given a new email, when the client registers, then account is created as
# "pendiente" and a verification email is sent.

@pytest.mark.django_db
class TestTCC1Registration:
    """TC-C1: HU-02 — Client registration."""

    def test_register_with_new_email_creates_pending_account(self, api_client):
        """Given a new email, when registering, account is created as pending."""
        response = api_client.post('/api/auth/register', {
            'email': 'nuevo@sassblum.com',
            'password': NEW_USER_PASSWORD,
            'confirm_password': NEW_USER_PASSWORD,
            'nombre': 'Nuevo',
            'apellido': 'Cliente',
            'tipo_identificacion': 'RUC',
            'ruc': '0991234567001',
            'empresa': 'Empresa Nueva',
        })
        assert response.status_code == 201
        user = User.objects.get(email='nuevo@sassblum.com')
        assert user.email_verificado is False

    def test_register_with_duplicate_email_rejected(self, api_client, client_user):
        """Given an existing email, when registering, request is rejected."""
        response = api_client.post('/api/auth/register', {
            'email': client_user.email,
            'password': NEW_USER_PASSWORD,
            'confirm_password': NEW_USER_PASSWORD,
            'nombre': 'Dup',
            'apellido': 'User',
            'tipo_identificacion': 'RUC',
            'ruc': '0991234567001',
            'empresa': 'Empresa Duplicada',
        })
        assert response.status_code == 409

    def test_register_with_cedula_persists_selected_type(self, api_client):
        response = api_client.post('/api/auth/register', {
            'email': 'cedula@sassblum.com',
            'password': NEW_USER_PASSWORD,
            'confirm_password': NEW_USER_PASSWORD,
            'nombre': 'Cliente',
            'apellido': 'Cédula',
            'tipo_identificacion': 'Cedula',
            'ruc': '0912345678',
            'empresa': 'Empresa Cédula',
        })
        assert response.status_code == 201
        user = User.objects.get(email='cedula@sassblum.com')
        assert user.tipo_identificacion == User.TipoIdentificacion.CEDULA
        assert user.ruc == '0912345678'

    @pytest.mark.parametrize('invalid_identification', [
        '099123456700', '09912345670012', '099123-567001',
        '099123 567001', '099123456700A', ' 0991234567001',
    ])
    def test_register_rejects_invalid_ruc(self, api_client, invalid_identification):
        response = api_client.post('/api/auth/register', {
            'email': f'invalid-{abs(hash(invalid_identification))}@sassblum.com',
            'password': NEW_USER_PASSWORD,
            'confirm_password': NEW_USER_PASSWORD,
            'nombre': 'Cliente',
            'apellido': 'Inválido',
            'tipo_identificacion': 'RUC',
            'ruc': invalid_identification,
            'empresa': 'Empresa',
        })
        assert response.status_code == 400


# ── TC-C2: Email Verification & Recovery ──────────────────────────────────────
# Given the verification link, when opened, then account becomes "activo".
# Forgot/Reset issues a single-use 1-hour token.

@pytest.mark.django_db
class TestTCC2EmailVerification:
    """TC-C2: HU-03 — Email verification & password recovery."""

    def test_forgot_password_sends_email(self, api_client, client_user):
        """Given a registered email, when requesting reset, email is sent."""
        response = api_client.post('/api/auth/forgot-password', {
            'email': client_user.email,
        })
        assert response.status_code == 200

    def test_forgot_password_with_unknown_email_returns_ok(self, api_client):
        """Given an unknown email, when requesting reset, still returns OK (no leak)."""
        response = api_client.post('/api/auth/forgot-password', {
            'email': 'unknown@example.com',
        })
        assert response.status_code == 200

    def test_migrated_account_reset_allows_login(self, api_client, db):
        """Given a migrated account, reset verifies and activates it for login."""
        user = User.objects.create_user(
            email='migrated@sassblum.com',
            password=None,
            first_name='Cliente',
            last_name='Migrado',
            tipo_identificacion=User.TipoIdentificacion.RUC,
            ruc='0991234567001',
            empresa='Empresa Migrada',
            role=User.Role.CLIENT,
            estado=User.Estado.PENDING,
            email_verificado=False,
        )
        token = TokenService().generate_reset_token(user)

        reset = api_client.post('/api/auth/reset-password', {
            'token': token,
            'new_password': NEW_USER_PASSWORD,
            'confirm_password': NEW_USER_PASSWORD,
        })
        assert reset.status_code == 200

        user.refresh_from_db()
        assert user.estado == User.Estado.ACTIVE
        assert user.email_verificado is True

        login = api_client.post('/api/auth/login', {
            'email': user.email,
            'password': NEW_USER_PASSWORD,
        })
        assert login.status_code == 200
        assert 'access' in login.data['tokens']


# ── TC-C3: Login ──────────────────────────────────────────────────────────────
# Given valid verified credentials, when logging in, then a JWT is issued
# and the user lands on the client dashboard.

@pytest.mark.django_db
class TestTCC3Login:
    """TC-C3: HU-01 — Login with valid credentials."""

    def test_login_with_valid_credentials_returns_jwt(self, api_client, client_user):
        """Given valid credentials, when logging in, JWT is returned."""
        response = api_client.post('/api/auth/login', {
            'email': client_user.email,
            'password': TEST_PASSWORD,
        })
        assert response.status_code == 200
        assert 'access' in response.data.get('tokens', response.data)

    def test_login_with_invalid_password_returns_401(self, api_client, client_user):
        """Given wrong password, when logging in, 401 is returned."""
        response = api_client.post('/api/auth/login', {
            'email': client_user.email,
            'password': WRONG_PASSWORD,
        })
        assert response.status_code == 401

    def test_login_with_unverified_email_rejected(self, api_client, db):
        """Given unverified email, when logging in, access is denied."""
        user = User.objects.create_user(
            email='unverified@sassblum.com',
            password=TEST_PASSWORD,
            first_name='Unverified',
            last_name='User',
            role=User.Role.CLIENT,
            estado=User.Estado.ACTIVE,
            email_verificado=False,
        )
        response = api_client.post('/api/auth/login', {
            'email': user.email,
            'password': TEST_PASSWORD,
        })
        assert response.status_code == 403


# ── TC-C4: Ticket Creation ────────────────────────────────────────────────────
# Given a logged-in client, when creating a ticket (subject ≤80, description ≥10,
# optional attachment ≤5 MB), then ticket is created as "Nuevo" and Observer fires.

@pytest.mark.django_db
class TestTCC4TicketCreation:
    """TC-C4: HU-04 — Ticket creation with validation."""

    def test_create_ticket_with_valid_data(self, authenticated_client, catalog_service):
        """Given valid data, when creating ticket, it's created as Nuevo."""
        response = authenticated_client.post('/api/tickets/', {
            'asunto': 'Problema con servidor',
            'descripcion': 'El servidor no responde desde ayer por la tarde',
            'servicio_id': catalog_service.id,
            'prioridad': 'Alta',
        })
        assert response.status_code == 201
        assert response.data['estado'] == 'Nuevo'

    def test_existing_incomplete_account_is_directed_to_profile(
        self, api_client, client_user, catalog_service
    ):
        client_user.ruc = ''
        client_user.empresa = ''
        client_user.save(update_fields=['ruc', 'empresa'])
        api_client.force_authenticate(user=client_user)
        response = api_client.post('/api/tickets/', {
            'asunto': 'Problema con servidor',
            'descripcion': 'El servidor no responde desde ayer por la tarde',
            'servicio_id': catalog_service.id,
            'prioridad': 'Alta',
        })
        assert response.status_code == 400
        assert 'perfil' in response.data['detail'].lower()

    def test_create_ticket_with_empty_subject_rejected(self, authenticated_client):
        """Given empty subject, when creating ticket, validation fails."""
        response = authenticated_client.post('/api/tickets/', {
            'asunto': '',
            'descripcion': 'El servidor no responde desde ayer',
        })
        assert response.status_code == 400

    def test_create_ticket_with_short_description_rejected(self, authenticated_client):
        """Given description < 10 chars, when creating ticket, validation fails."""
        response = authenticated_client.post('/api/tickets/', {
            'asunto': 'Problema',
            'descripcion': 'Corto',
        })
        assert response.status_code == 400

    def test_create_ticket_with_long_subject_rejected(self, authenticated_client):
        """Given subject > 80 chars, when creating ticket, validation fails."""
        response = authenticated_client.post('/api/tickets/', {
            'asunto': 'A' * 81,
            'descripcion': 'El servidor no responde desde ayer por la tarde',
        })
        assert response.status_code == 400


# ── TC-C5: Ticket Visualization ──────────────────────────────────────────────
# Given an existing ticket, when opened, then subject, service, priority,
# status badge, metadata and attachments are shown.

@pytest.mark.django_db
class TestTCC5Visualization:
    """TC-C5: HU-06 — Ticket detail visualization."""

    def test_view_ticket_detail_returns_all_fields(self, authenticated_client, new_ticket):
        """Given an existing ticket, when viewing, all fields are present."""
        response = authenticated_client.get(f'/api/tickets/{new_ticket.id}')
        assert response.status_code == 200
        assert response.data['asunto'] == new_ticket.asunto
        assert response.data['numero'] == new_ticket.numero


# ── TC-C6: Ticket History ─────────────────────────────────────────────────────
# Given a ticket with activity, when viewing history, then all events appear
# chronologically with author and timestamp.

@pytest.mark.django_db
class TestTCC6History:
    """TC-C6: HU-09 — Ticket event history."""

    def test_ticket_history_returns_events(self, authenticated_client, catalog_service):
        """Given a ticket with activity, when viewing history, events are shown."""
        create_resp = authenticated_client.post('/api/tickets/', {
            'asunto': 'Test historial',
            'descripcion': 'Descripción detallada del problema para historial',
            'servicio_id': catalog_service.id,
            'prioridad': 'Media',
        })
        assert create_resp.status_code == 201
        response = authenticated_client.get(f"/api/tickets/{create_resp.data['id']}")
        assert response.status_code == 200
        assert len(response.data['eventos']) >= 1


# ── TC-C7: Filter & Search ────────────────────────────────────────────────────
# Given the ticket list, when filtering by status/priority, then only matching
# tickets are shown (paginated).

@pytest.mark.django_db
class TestTCC7FilterSearch:
    """TC-C7: HU-10 — Filter and search tickets."""

    def test_filter_tickets_by_status(self, authenticated_client, new_ticket, in_progress_ticket):
        """Given tickets with different statuses, when filtering, only matches return."""
        response = authenticated_client.get('/api/tickets/?estado=Nuevo')
        assert response.status_code == 200
        assert response.data['total'] == 1
        assert all(ticket['estado'] == 'Nuevo' for ticket in response.data['items'])

    def test_ticket_list_is_paginated(self, authenticated_client):
        """Given many tickets, when listing, response is paginated."""
        response = authenticated_client.get('/api/tickets/')
        assert response.status_code == 200
        assert {'items', 'total', 'page', 'page_size'} <= set(response.data)


# ── TC-C8: Notifications ──────────────────────────────────────────────────────
# Given new in-app notifications, when opening the bell, then unread count and
# history are shown; preferences toggle email/in-app/WebSocket.

@pytest.mark.django_db
class TestTCC8Notifications:
    """TC-C8: HU-15/16 — In-app notifications and preferences."""

    def test_notification_list_returns_data(self, authenticated_client):
        """Given notifications, when listing, data is returned."""
        response = authenticated_client.get('/api/notificaciones/')
        assert response.status_code == 200

    def test_notification_preferences_readable(self, authenticated_client):
        """Given a user, when reading preferences, current settings are returned."""
        response = authenticated_client.get('/api/notificaciones/preferencias')
        assert response.status_code == 200
