"""Endpoint autenticado para cambiar la contraseña propia."""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.cookies import clear_refresh_cookie
from apps.authentication.serializers import ChangePasswordSerializer
from apps.authentication.services import get_auth_service
from apps.authentication.services.auth_service import (
    CurrentPasswordIncorrect,
    PasswordUnchanged,
    PasswordPolicyViolation,
)
from apps.authentication.throttles import ChangePasswordThrottle


class ChangePasswordView(APIView):
    """POST /api/auth/cambiar-password para el usuario autenticado."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ChangePasswordThrottle]

    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            result = get_auth_service().change_password(
                request.user,
                data["current_password"],
                data["new_password"],
            )
        except (CurrentPasswordIncorrect, PasswordUnchanged, PasswordPolicyViolation) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # La sesión actual también termina: el frontend debe pedir un login nuevo.
        return clear_refresh_cookie(Response(result, status=status.HTTP_200_OK))
