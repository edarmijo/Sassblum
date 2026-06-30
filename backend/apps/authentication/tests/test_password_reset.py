"""
Tests for TokenService (password reset) — requires the database.
Run: pytest apps/authentication/tests/test_password_reset.py -v

These use @pytest.mark.django_db and run in your environment (Supabase / local PG).
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.authentication.models import User, PasswordResetToken
from apps.authentication.services.token_service import (
    TokenService,
    TokenExpired,
    InvalidToken,
)


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="reset@example.com", password="OldPass123", role=User.Role.CLIENT
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
        with pytest.raises(InvalidToken):
            TokenService().validate_reset_token("00000000-0000-0000-0000-000000000000")

    def test_validate_raises_invalid_for_used_token(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        svc.consume_token(token)
        with pytest.raises(InvalidToken):
            svc.validate_reset_token(token)

    def test_validate_raises_expired(self, user):
        token = TokenService().generate_reset_token(user)
        prt = PasswordResetToken.objects.get(token=token)
        prt.expira_en = timezone.now() - timedelta(minutes=1)
        prt.save(update_fields=["expira_en"])
        with pytest.raises(TokenExpired):
            TokenService().validate_reset_token(token)

    def test_consume_marks_used(self, user):
        svc = TokenService()
        token = svc.generate_reset_token(user)
        svc.consume_token(token)
        assert PasswordResetToken.objects.get(token=token).usado is True
