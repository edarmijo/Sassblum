"""
Password reset DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ TokenService. No token logic, no ORM here.
Pattern: SRP (TokenService separate) + DIP.
SOLID: SRP · DIP

Endpoints:
    POST /api/auth/forgot-password  → ForgotPasswordView
    POST /api/auth/reset-password   → ResetPasswordView

Security:
    forgot-password returns the SAME generic response whether or not the email
    exists (no user enumeration).
"""

import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.models import User
from apps.authentication.cookies import clear_refresh_cookie
from apps.authentication.serializers import (
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from apps.authentication.services import TokenService, get_auth_service
from apps.authentication.services.password_policy import PasswordPolicyViolation
from apps.authentication.services.token_service import InvalidToken, TokenExpired

logger = logging.getLogger(__name__)

_GENERIC_FORGOT_MSG = (
    "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
)


class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password — request a reset link."""

    # Empty authentication_classes prevents JWTAuthentication from raising
    # AuthenticationFailed on an expired token before AllowAny can act.
    # A user with a stale session in-browser would otherwise get a 401 that
    # triggers the ApiClient refresh loop and produces an infinite spinner.
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email=email).first()
        if user is not None:
            token = TokenService().generate_reset_token(user)
            self._dispatch_reset_email(user, token)

        # Same response regardless of existence (no enumeration)
        return Response({"message": _GENERIC_FORGOT_MSG}, status=status.HTTP_200_OK)

    @staticmethod
    def _dispatch_reset_email(user, token: str) -> None:
        """
        Send the password_reset email via EmailNotificationStrategy directly
        (this is not a TicketEvent, so it bypasses the Observer).

        validate() is intentionally skipped: it gates normal ticket notifications
        to active+verified users, but password reset is a transactional security
        email that must reach any registered address regardless of account state
        (same pattern used by auth_service._dispatch_verification_email).
        """
        from django.conf import settings  # noqa: PLC0415
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415

        frontend = getattr(settings, 'FRONTEND_URL', None) or 'https://sassblum.vercel.app'
        reset_url = f"{frontend.rstrip('/')}/reset-password?token={token}"
        context = {
            "tipo": "password_reset",
            "titulo": "Restablece tu contraseña",
            "cuerpo": "Solicitaste restablecer tu contraseña.",
            "reset_url": reset_url,
            "expira_en": "1 hora",
            "recipient_nombre": user.first_name,
        }
        try:
            strategy = NotificationFactory.build("email")
            strategy.send(user, "Restablece tu contraseña", context)
        except Exception:  # noqa: BLE001
            # Log internally for Render visibility; never propagate to caller
            # (the view always returns 200 to avoid user enumeration).
            logger.exception(
                "password_reset_email_failed | user_id=%s email=%s",
                user.pk,
                user.email,
            )


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password — set a new password using a valid token."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            result = get_auth_service().reset_password(
                data["token"],
                data["new_password"],
            )
        except InvalidToken as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except TokenExpired as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_410_GONE)
        except PasswordPolicyViolation as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return clear_refresh_cookie(Response(result, status=status.HTTP_200_OK))
