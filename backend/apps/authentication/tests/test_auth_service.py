"""
Tests for AuthService (requires DB). authenticate + register + lockout.
Run: pytest apps/authentication/tests/test_auth_service.py -v
"""

import pytest

from apps.authentication.models import User
from apps.authentication.services.auth_service import (
    AuthService,
    AuthenticationFailed,
    AccountLocked,
    EmailNotVerified,
    EmailAlreadyExists,
    PasswordPolicyViolation,
)


@pytest.fixture
def active_user(db):
    u = User.objects.create_user(
        email="user@example.com", password="Pass1234",
        role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=True,
    )
    return u


@pytest.mark.django_db
class TestAuthenticate:
    def test_success_returns_user_and_tokens(self, active_user):
        result = AuthService().authenticate("user@example.com", "Pass1234")
        assert result["user"]["email"] == "user@example.com"
        assert "access" in result["tokens"] and "refresh" in result["tokens"]

    def test_wrong_password_increments_attempts(self, active_user):
        with pytest.raises(AuthenticationFailed):
            AuthService().authenticate("user@example.com", "wrong")
        active_user.refresh_from_db()
        assert active_user.intentos_fallidos == 1

    def test_lockout_after_five_failures(self, active_user):
        svc = AuthService()
        for _ in range(5):
            with pytest.raises((AuthenticationFailed, AccountLocked)):
                svc.authenticate("user@example.com", "wrong")
        active_user.refresh_from_db()
        assert active_user.estado == User.Estado.BLOCKED

    def test_unverified_email_rejected(self, db):
        User.objects.create_user(
            email="pending@example.com", password="Pass1234",
            role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=False,
        )
        with pytest.raises(EmailNotVerified):
            AuthService().authenticate("pending@example.com", "Pass1234")

    def test_unknown_email_fails(self, db):
        with pytest.raises(AuthenticationFailed):
            AuthService().authenticate("nobody@example.com", "Pass1234")

    def test_success_resets_attempt_counter(self, active_user):
        active_user.intentos_fallidos = 3
        active_user.save(update_fields=["intentos_fallidos"])
        AuthService().authenticate("user@example.com", "Pass1234")
        active_user.refresh_from_db()
        assert active_user.intentos_fallidos == 0


@pytest.mark.django_db
class TestRegister:
    def test_creates_pending_client(self, db):
        result = AuthService().register({
            "nombre": "Ana", "apellido": "Pérez",
            "email": "new@example.com", "password": "Pass1234",
        })
        assert "message" in result
        user = User.objects.get(email="new@example.com")
        assert user.role == User.Role.CLIENT
        assert user.estado == User.Estado.PENDING
        assert user.email_verificado is False

    def test_duplicate_email_rejected(self, active_user):
        with pytest.raises(EmailAlreadyExists):
            AuthService().register({
                "nombre": "X", "apellido": "Y",
                "email": "user@example.com", "password": "Pass1234",
            })

    def test_weak_password_rejected(self, db):
        with pytest.raises(PasswordPolicyViolation):
            AuthService().register({
                "nombre": "X", "apellido": "Y",
                "email": "weak@example.com", "password": "short",
            })


@pytest.mark.django_db
class TestVerifyEmail:
    def test_verify_activates_user(self, db):
        from django.core import signing
        from apps.authentication.services.auth_service import _VERIFY_SALT
        user = User.objects.create_user(
            email="verify@example.com", password="Pass1234",
            role=User.Role.CLIENT, estado=User.Estado.PENDING, email_verificado=False,
        )
        token = signing.dumps({"uid": user.id}, salt=_VERIFY_SALT)
        AuthService().verify_email(token)
        user.refresh_from_db()
        assert user.email_verificado is True
        assert user.estado == User.Estado.ACTIVE
