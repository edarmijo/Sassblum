"""
Tests for AuthService (requires DB). authenticate + register + lockout.
Run: pytest apps/authentication/tests/test_auth_service.py -v
"""

from core.testing import random_credential

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

# Generada por corrida (core.testing): sin credenciales hardcodeadas.
TEST_PASSWORD = random_credential()


@pytest.fixture
def active_user(db):
    u = User.objects.create_user(
        email="user@example.com", password=TEST_PASSWORD,
        role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=True,
    )
    return u


@pytest.mark.django_db
class TestAuthenticate:
    def test_success_returns_user_and_tokens(self, active_user):
        result = AuthService().authenticate("user@example.com", TEST_PASSWORD)
        assert result["user"]["email"] == "user@example.com"
        assert "access" in result["tokens"]
        assert "refresh" in result["tokens"]

    def test_wrong_password_increments_attempts(self, active_user):
        svc = AuthService()
        with pytest.raises(AuthenticationFailed):
            svc.authenticate("user@example.com", "wrong")
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
            email="pending@example.com", password=TEST_PASSWORD,
            role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=False,
        )
        svc = AuthService()
        with pytest.raises(EmailNotVerified):
            svc.authenticate("pending@example.com", TEST_PASSWORD)

    def test_unknown_email_fails(self, db):
        svc = AuthService()
        with pytest.raises(AuthenticationFailed):
            svc.authenticate("nobody@example.com", TEST_PASSWORD)

    def test_success_resets_attempt_counter(self, active_user):
        active_user.intentos_fallidos = 3
        active_user.save(update_fields=["intentos_fallidos"])
        AuthService().authenticate("user@example.com", TEST_PASSWORD)
        active_user.refresh_from_db()
        assert active_user.intentos_fallidos == 0

    def test_existing_incomplete_client_can_still_login(self, active_user):
        result = AuthService().authenticate("user@example.com", TEST_PASSWORD)
        assert result["user"]["ruc"] == ""
        assert result["user"]["empresa"] == ""


@pytest.mark.django_db
class TestRegister:
    def test_creates_pending_client(self, db):
        result = AuthService().register({
            "nombre": "Ana", "apellido": "Pérez",
            "email": "new@example.com", "password": TEST_PASSWORD,
            "tipo_identificacion": User.TipoIdentificacion.RUC,
            "ruc": "0991234567001", "empresa": "Empresa Nueva",
        })
        assert "message" in result
        user = User.objects.get(email="new@example.com")
        assert user.role == User.Role.CLIENT
        assert user.estado == User.Estado.PENDING
        assert user.email_verificado is False
        assert user.tipo_identificacion == User.TipoIdentificacion.RUC
        assert user.ruc == "0991234567001"
        assert user.empresa == "Empresa Nueva"

    def test_duplicate_email_rejected(self, active_user):
        svc = AuthService()
        with pytest.raises(EmailAlreadyExists):
            svc.register({
                "nombre": "X", "apellido": "Y",
                "email": "user@example.com", "password": TEST_PASSWORD,
                "ruc": "0991234567001", "empresa": "Empresa",
            })

    def test_weak_password_rejected(self, db):
        svc = AuthService()
        with pytest.raises(PasswordPolicyViolation):
            svc.register({
                "nombre": "X", "apellido": "Y",
                "email": "weak@example.com", "password": TEST_PASSWORD[:5],
                "ruc": "0991234567001", "empresa": "Empresa",
            })


@pytest.mark.django_db
class TestVerifyEmail:
    def test_verify_activates_user(self, db):
        from django.core import signing
        from apps.authentication.services.auth_service import _VERIFY_SALT
        user = User.objects.create_user(
            email="verify@example.com", password=TEST_PASSWORD,
            role=User.Role.CLIENT, estado=User.Estado.PENDING, email_verificado=False,
        )
        token = signing.dumps({"uid": user.id}, salt=_VERIFY_SALT)
        AuthService().verify_email(token)
        user.refresh_from_db()
        assert user.email_verificado is True
        assert user.estado == User.Estado.ACTIVE
