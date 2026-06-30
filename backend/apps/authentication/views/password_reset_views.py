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

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.models import User
from apps.authentication.serializers import (
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from apps.authentication.services import TokenService
from apps.authentication.services.token_service import InvalidToken, TokenExpired

_GENERIC_FORGOT_MSG = (
    "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
)


class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password — request a reset link."""

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
        """
        from django.conf import settings  # noqa: PLC0415
        from apps.notifications.factory import NotificationFactory  # noqa: PLC0415

        frontend = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend}/reset-password?token={token}"
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
            if strategy.validate(user):
                strategy.send(user, "Restablece tu contraseña", context)
        except Exception:  # noqa: BLE001
            pass  # email failure must not reveal anything to the caller


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password — set a new password using a valid token."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = TokenService()
        try:
            user = service.validate_reset_token(data["token"])
        except InvalidToken as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except TokenExpired as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_410_GONE)

        user.set_password(data["new_password"])
        user.save(update_fields=["password"])

        service.consume_token(data["token"])
        service.invalidate_sessions(user)

        return Response(
            {"message": "Contraseña actualizada. Inicia sesión nuevamente."},
            status=status.HTTP_200_OK,
        )
