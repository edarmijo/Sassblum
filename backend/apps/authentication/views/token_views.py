"""
Token refresh view — cookie-based session rehydration (BUG-06, paso 2).

Responsibility (SRP): traducir HTTP ↔ IAuthService.refresh_session y aplicar la
política de cookies. Ni rotación ni blacklist viven aquí (eso es del servicio).

Sustituye a `TokenRefreshView` de simplejwt porque necesita dos cosas que aquella
no hace: leer el refresh token de una cookie httpOnly, y devolver el usuario para
que el cliente no tenga que persistir datos de sesión en disco.

Endpoint:
    POST /api/auth/token/refresh → CookieTokenRefreshView (AllowAny)
"""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.cookies import (
    clear_refresh_cookie,
    read_refresh_token,
    set_refresh_cookie,
)
from apps.authentication.services import get_auth_service
from apps.authentication.services.auth_service import InvalidRefreshToken


class CookieTokenRefreshView(APIView):
    """POST /api/auth/token/refresh — canjea la cookie refresh por un access."""

    # Sin autenticador: el access token entrante está vencido por definición aquí,
    # y JWTAuthentication respondería 401 antes de que AllowAny actúe (ver BUG-02).
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = read_refresh_token(request)
        if not token:
            return Response(
                {"detail": "No hay sesión activa."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            result = get_auth_service().refresh_session(token)
        except InvalidRefreshToken as exc:
            # Cookie inservible: se borra para no reintentar en cada carga.
            response = Response(
                {"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED
            )
            return clear_refresh_cookie(response)

        response = Response(
            {
                "access": result["access"],
                "user": result["user"],
            },
            status=status.HTTP_200_OK,
        )
        return set_refresh_cookie(response, result["refresh"])
