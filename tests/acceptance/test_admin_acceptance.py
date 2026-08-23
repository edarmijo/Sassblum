"""
ADMIN Role Acceptance Tests — TC-A1 to TC-A6
═════════════════════════════════════════════
Source: Template FIEC — SassBlum Ticket Management System
Role: Administrator · Account: admin@sassblum.com
"""

import pytest

from helpers import TEST_PASSWORD


# ── TC-A1: Admin Login ────────────────────────────────────────────────────────
# Given admin credentials, when logging in, then the admin dashboard shows
# all tickets across all clients.

@pytest.mark.django_db
class TestTCA1AdminLogin:
    """TC-A1: HU-01 — Admin login and full dashboard."""

    def test_admin_login_returns_jwt(self, api_client, admin_user):
        """Given admin credentials, when logging in, JWT is issued."""
        response = api_client.post('/api/auth/login', {
            'email': admin_user.email,
            'password': TEST_PASSWORD,
        })
        assert response.status_code == 200
        assert 'access' in response.data.get('tokens', response.data)

    def test_admin_can_list_all_tickets(self, authenticated_admin):
        """Given an admin, when listing tickets, all tickets are visible."""
        response = authenticated_admin.get('/api/tickets/')
        assert response.status_code == 200

    def test_admin_can_list_all_users(self, authenticated_admin):
        """Given an admin, when listing users, all users are visible."""
        response = authenticated_admin.get('/api/usuarios/')
        assert response.status_code == 200


# ── TC-A7: Complete Admin Flow ───────────────────────────────────────────────

@pytest.mark.django_db
class TestTCA7CompleteAdminFlow:
    """TC-A7: Admin login through ticket assignment and reporting."""

    def test_admin_can_login_assign_ticket_review_history_and_report(
        self, api_client, admin_user, new_ticket, worker_user
    ):
        """Given an admin, the complete ticket management workflow is available."""
        login = api_client.post('/api/auth/login', {
            'email': admin_user.email,
            'password': TEST_PASSWORD,
        })
        assert login.status_code == 200
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['tokens']['access']}")

        tickets = api_client.get('/api/tickets/')
        assert tickets.status_code == 200
        assert any(ticket['id'] == new_ticket.id for ticket in tickets.data['items'])

        assignment = api_client.patch(f'/api/tickets/{new_ticket.id}/asignar', {
            'worker_id': worker_user.id,
        })
        assert assignment.status_code == 200

        detail = api_client.get(f'/api/tickets/{new_ticket.id}')
        assert detail.status_code == 200
        assert detail.data['estado'] == 'EnProceso'
        assert detail.data['eventos']

        report = api_client.get('/api/reportes/tickets')
        assert report.status_code == 200
        assert 'total' in report.data


# ── TC-A2: Assignment ─────────────────────────────────────────────────────────
# Given ticket T-2026-9001 in "Nuevo" (seeded, unassigned), when assigning it
# to an active worker, then status becomes "EnProceso" and worker is notified.

@pytest.mark.django_db
class TestTCA2Assignment:
    """TC-A2: HU-05 — Ticket assignment to worker."""

    def test_assign_ticket_to_worker(self, authenticated_admin, new_ticket, worker_user):
        """Given a new ticket, when assigning to worker, status changes to EnProceso."""
        response = authenticated_admin.patch(f'/api/tickets/{new_ticket.id}/asignar', {
            'worker_id': worker_user.id,
        })
        assert response.status_code == 200
        new_ticket.refresh_from_db()
        assert new_ticket.asignado_id == worker_user.id
        assert new_ticket.estado == 'EnProceso'

    def test_assign_ticket_requires_admin_role(self, authenticated_client, new_ticket, worker_user):
        """Given a client user, when trying to assign, access is denied."""
        response = authenticated_client.patch(f'/api/tickets/{new_ticket.id}/asignar', {
            'worker_id': worker_user.id,
        })
        assert response.status_code == 403


# ── TC-A3: Reassignment ──────────────────────────────────────────────────────
# Given an assigned ticket, when reassigning to another worker, then the change
# is recorded in history and both workers are notified.

@pytest.mark.django_db
class TestTCA3Reassignment:
    """TC-A3: HU-08 — Ticket reassignment."""

    def test_reassign_ticket_to_different_worker(
        self, authenticated_admin, in_progress_ticket, second_worker_user
    ):
        """Given an assigned ticket, when reassigning, change is recorded."""
        response = authenticated_admin.patch(f'/api/tickets/{in_progress_ticket.id}/reasignar', {
            'worker_id': second_worker_user.id,
        })
        assert response.status_code == 200
        in_progress_ticket.refresh_from_db()
        assert in_progress_ticket.asignado_id == second_worker_user.id


# ── TC-A4: Reports ────────────────────────────────────────────────────────────
# Given ticket data, when generating a report with date/status filters, then
# KPIs and charts render.

@pytest.mark.django_db
class TestTCA4Reports:
    """TC-A4: HU-17 — Report generation with filters."""

    def test_report_dashboard_returns_kpis(self, authenticated_admin):
        """Given ticket data, when viewing report, KPIs are returned."""
        response = authenticated_admin.get('/api/reportes/tickets')
        assert response.status_code == 200
        assert 'total' in response.data

    def test_report_with_date_filter(self, authenticated_admin):
        """Given a date range, when filtering report, data is filtered."""
        response = authenticated_admin.get(
            '/api/reportes/tickets?fecha_desde=2026-01-01&fecha_hasta=2026-12-31'
        )
        assert response.status_code == 200

    def test_report_with_status_filter(self, authenticated_admin):
        """Given a status filter, when filtering report, only matching tickets show."""
        response = authenticated_admin.get('/api/reportes/tickets?estado=Nuevo')
        assert response.status_code == 200

    def test_report_with_client_filter(self, authenticated_admin):
        """Given a client name filter, when filtering report, data is filtered."""
        response = authenticated_admin.get('/api/reportes/tickets?cliente_nombre=Test')
        assert response.status_code == 200


# ── TC-A5: Export ─────────────────────────────────────────────────────────────
# Given a report, when exporting, then a PDF / Excel file downloads correctly.

@pytest.mark.django_db
class TestTCA5Export:
    """TC-A5: HU-18 — Data export (PDF, Excel)."""

    def test_export_csv_is_rejected(self, authenticated_admin):
        """Given CSV was retired, when requesting it, the API rejects it."""
        response = authenticated_admin.post('/api/reportes/exportar', {
            'formato': 'csv',
        })
        assert response.status_code == 400

    def test_export_excel(self, authenticated_admin):
        """Given report data, when exporting Excel, file is returned."""
        response = authenticated_admin.post('/api/reportes/exportar', {
            'formato': 'excel',
        })
        assert response.status_code == 200
        assert response['Content-Type'] == (
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        assert 'reporte_tickets.xlsx' in response['Content-Disposition']

    def test_export_pdf(self, authenticated_admin):
        """Given report data, when exporting PDF, file is returned."""
        response = authenticated_admin.post('/api/reportes/exportar', {
            'formato': 'pdf',
        })
        assert response.status_code == 200
        assert response['Content-Type'] == 'application/pdf'
        assert 'reporte_tickets.pdf' in response['Content-Disposition']


# ── TC-A6: User Management ───────────────────────────────────────────────────
# Given the user admin page, when creating / blocking / unblocking a user, then
# the change is persisted; a blocked user cannot log in.

@pytest.mark.django_db
class TestTCA6UserManagement:
    """TC-A6: HU-14 — User management (create, block, unblock)."""

    def test_admin_can_list_users(self, authenticated_admin):
        """Given an admin, when viewing users, list is returned."""
        response = authenticated_admin.get('/api/usuarios/')
        assert response.status_code == 200

    def test_admin_can_block_user(self, authenticated_admin, client_user):
        """Given an active user, when blocking, status changes."""
        response = authenticated_admin.patch(f'/api/usuarios/{client_user.id}/bloquear')
        assert response.status_code == 200
        client_user.refresh_from_db()
        assert client_user.estado == client_user.Estado.BLOCKED

    def test_blocked_user_cannot_login(self, api_client, db):
        """Given a blocked user, when logging in, access is denied."""
        from apps.authentication.models import User
        blocked = User.objects.create_user(
            email='blocked@sassblum.com',
            password=TEST_PASSWORD,
            first_name='Blocked',
            last_name='User',
            role=User.Role.CLIENT,
            estado=User.Estado.BLOCKED,
            email_verificado=True,
        )
        response = api_client.post('/api/auth/login', {
            'email': blocked.email,
            'password': TEST_PASSWORD,
        })
        # 423 Locked es la respuesta canónica del AuthService para cuentas bloqueadas
        assert response.status_code == 423
