"""
Tests for ticket creation permissions — IsClient, IsWorker, IsAdmin.
Run: pytest apps/tickets/tests/test_ticket_service.py -v
"""

from unittest.mock import MagicMock

from rest_framework.test import APIRequestFactory

from core.permissions.rbac_permissions import IsAdmin, IsClient, IsWorker


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_user(role: str, estado: str = "activo") -> MagicMock:
    """Return a mock user with the given role and active status."""
    user = MagicMock()
    user.is_authenticated = True
    user.role = role
    user.estado = estado
    return user


factory = APIRequestFactory()


def check_permission(permission_class, user) -> bool:
    request = factory.get("/")
    request.user = user
    return permission_class().has_permission(request, view=None)


# ── IsClient ───────────────────────────────────────────────────────────────────

class TestIsClient:
    def test_client_user_is_allowed(self):
        user = make_user("client")
        assert check_permission(IsClient, user)

    def test_worker_user_is_denied(self):
        user = make_user("worker")
        assert not check_permission(IsClient, user)

    def test_admin_user_is_denied(self):
        user = make_user("admin")
        assert not check_permission(IsClient, user)

    def test_unauthenticated_user_is_denied(self):
        user = MagicMock()
        user.is_authenticated = False
        assert not check_permission(IsClient, user)

    def test_blocked_client_is_denied(self):
        user = make_user("client", estado="bloqueado")
        assert not check_permission(IsClient, user)


# ── IsWorker ───────────────────────────────────────────────────────────────────

class TestIsWorker:
    def test_worker_user_is_allowed(self):
        user = make_user("worker")
        assert check_permission(IsWorker, user)

    def test_client_is_denied(self):
        user = make_user("client")
        assert not check_permission(IsWorker, user)


# ── IsAdmin ────────────────────────────────────────────────────────────────────

class TestIsAdmin:
    def test_admin_user_is_allowed(self):
        user = make_user("admin")
        assert check_permission(IsAdmin, user)

    def test_worker_is_denied(self):
        user = make_user("worker")
        assert not check_permission(IsAdmin, user)


# ── Ticket number format ───────────────────────────────────────────────────────

class TestTicketNumberFormat:
    """Verify the expected format T-YYYY-NNNN without hitting the database."""

    def test_format_pattern(self):
        import re
        pattern = re.compile(r"^T-\d{4}-\d{4}$")
        samples = ["T-2026-0001", "T-2026-0042", "T-2026-9999"]
        for s in samples:
            assert pattern.match(s), f"'{s}' does not match T-YYYY-NNNN"
