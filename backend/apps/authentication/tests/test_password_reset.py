"""
Tests for TokenService (password reset) — requires the database.
Run: pytest apps/authentication/tests/test_password_reset.py -v

These use @pytest.mark.django_db and run in your environment (Supabase / local PG).
"""

from core.testing import random_credential
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.authentication.models import User, PasswordResetToken
from apps.authentication.services.token_service import (
    TokenService,
    TokenExpired,
    InvalidToken,
)

# Generada por corrida (core.testing): sin credenciales hardcodeadas.
TEST_PASSWORD = random_credential()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="reset@example.com", password=TEST_PASSWORD, role=User.Role.CLIENT
    )


@pytest.mark.django_db
class TestTokenService:
    def test_generate_creates_active_token(self, user):
        token = TokenService().generate_reset_token(user)
        prt = PasswordResetToken.objects.get(token=token)
        assert prt.usado is False
        assert prt.usuario == user
        assert prt.expira_en > timezone.now()

    def test_generate_invalidates_previous_tokens(self, user):
        svc = TokenService()
        first = svc.generate_reset_token(user)
        svc.generate_reset_token(user)
        assert PasswordResetToken.objects.get(token=first).usado is True

    def test_validate_returns_user_for_valid_token(self, user):
        token = TokenService().generate_reset_token(user)
        assert TokenService().validate_reset_token(token) == user

    def test_validate_raises_invalid_for_unknown_token(self):
        svc = TokenService()
        with pytest.raises(InvalidToken):
            svc.validate_reset_token("00000000-0000-0000-0000-000000000000")

    def test_validate_raises_invalid_for_used_token(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        svc.consume_token(token)
        with pytest.raises(InvalidToken):
            svc.validate_reset_token(token)

    def test_validate_raises_expired(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        prt = PasswordResetToken.objects.get(token=token)
        prt.expira_en = timezone.now() - timedelta(minutes=1)
        prt.save(update_fields=["expira_en"])
        with pytest.raises(TokenExpired):
            svc.validate_reset_token(token)

    def test_consume_marks_used(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        svc.consume_token(token)
        assert PasswordResetToken.objects.get(token=token).usado is True


@pytest.mark.django_db
class TestResetPasswordEndpoint:
    def test_pending_account_reset_activates_verifies_and_allows_login(self):
        user = User.objects.create_user(
            email="migrated@example.com",
            password=None,
            role=User.Role.CLIENT,
            estado=User.Estado.PENDING,
            email_verificado=False,
        )
        assert user.has_usable_password() is False
        token = TokenService().generate_reset_token(user)
        new_password = random_credential()
        client = APIClient()

        response = client.post(
            "/api/auth/reset-password",
            {
                "token": token,
                "new_password": new_password,
                "confirm_password": new_password,
            },
        )

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.email_verificado is True
        assert user.estado == User.Estado.ACTIVE
        assert user.check_password(new_password)

        login = client.post(
            "/api/auth/login",
            {"email": user.email, "password": new_password},
        )
        assert login.status_code == 200
        assert "access" in login.data["tokens"]

        reused = client.post(
            "/api/auth/reset-password",
            {
                "token": token,
                "new_password": new_password,
                "confirm_password": new_password,
            },
        )
        assert reused.status_code == 400

    def test_reset_does_not_remove_administrative_block(self, user):
        user.estado = User.Estado.BLOCKED
        user.email_verificado = False
        user.save(update_fields=["estado", "email_verificado"])
        token = TokenService().generate_reset_token(user)
        new_password = random_credential()
        client = APIClient()

        response = client.post(
            "/api/auth/reset-password",
            {
                "token": token,
                "new_password": new_password,
                "confirm_password": new_password,
            },
        )

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.email_verificado is True
        assert user.estado == User.Estado.BLOCKED
        assert user.check_password(new_password)
        login = client.post(
            "/api/auth/login",
            {"email": user.email, "password": new_password},
        )
        assert login.status_code == 423

    def test_expired_token_does_not_change_account(self, user):
        token = TokenService().generate_reset_token(user)
        reset_token = PasswordResetToken.objects.get(token=token)
        reset_token.expira_en = timezone.now() - timedelta(minutes=1)
        reset_token.save(update_fields=["expira_en"])
        new_password = random_credential()

        response = APIClient().post(
            "/api/auth/reset-password",
            {
                "token": token,
                "new_password": new_password,
                "confirm_password": new_password,
            },
        )

        assert response.status_code == 410
        user.refresh_from_db()
        reset_token.refresh_from_db()
        assert user.email_verificado is False
        assert user.estado == User.Estado.PENDING
        assert user.check_password(TEST_PASSWORD)
        assert reset_token.usado is False

    def test_unknown_token_returns_bad_request(self):
        new_password = random_credential()
        response = APIClient().post(
            "/api/auth/reset-password",
            {
                "token": "00000000-0000-0000-0000-000000000000",
                "new_password": new_password,
                "confirm_password": new_password,
            },
        )
        assert response.status_code == 400
