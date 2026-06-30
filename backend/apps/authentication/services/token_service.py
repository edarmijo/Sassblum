"""
TokenService — password-reset token lifecycle (SRP, separate from AuthService).

Responsibility (SRP): create, validate, and consume one-time reset tokens, and
    invalidate active sessions. It does NOT authenticate or register — that is
    AuthService's job. Keeping this separate means the reset-token policy can change
    without touching AuthService (OCP).
Depends on: PasswordResetToken, User models; simplejwt blacklist for session kill.
Pattern: SRP-focused service.
SOLID: SRP · DIP · OCP

Token policy:
    - UUID4, single-use, expires 1 hour after creation.
"""

from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from apps.authentication.models import PasswordResetToken, User

TOKEN_TTL = timedelta(hours=1)


class TokenExpired(Exception):
    """Raised when a reset token is past its expiry."""


class InvalidToken(Exception):
    """Raised when a reset token does not exist or was already used."""


class TokenService:
    """Manages password-reset tokens and session invalidation."""

    def generate_reset_token(self, user: User) -> str:
        """
        Create a fresh single-use reset token for the user (expires in 1h).
        Any previous unused tokens for the user are invalidated first.
        Returns the token string (UUID).
        """
        PasswordResetToken.objects.filter(usuario=user, usado=False).update(usado=True)
        token = PasswordResetToken.objects.create(
            usuario=user,
            expira_en=timezone.now() + TOKEN_TTL,
        )
        return str(token.token)

    def validate_reset_token(self, token: str) -> User:
        """
        Validate a reset token and return its user.
        Raises InvalidToken (missing/used) or TokenExpired.
        Does NOT mark the token as used — call consume_token() after a successful reset.
        """
        prt = PasswordResetToken.objects.filter(token=token, usado=False).first()
        if prt is None:
            raise InvalidToken("Token inválido o ya utilizado.")
        if prt.expira_en < timezone.now():
            raise TokenExpired("El token de recuperación ha expirado.")
        return prt.usuario

    def consume_token(self, token: str) -> None:
        """Mark the token as used (single-use enforcement)."""
        PasswordResetToken.objects.filter(token=token).update(usado=True)

    def invalidate_sessions(self, user: User) -> None:
        """
        Blacklist all outstanding refresh tokens for the user, forcing re-login
        on every device after a password reset.
        """
        try:
            from rest_framework_simplejwt.token_blacklist.models import (  # noqa: PLC0415
                OutstandingToken,
                BlacklistedToken,
            )
        except ImportError:
            return  # token_blacklist app not installed — nothing to invalidate

        for outstanding in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding)
