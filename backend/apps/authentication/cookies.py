"""
Refresh-token cookie policy — un solo lugar decide cómo se emite y se lee.

Responsibility (SRP): atributos, nombre y lectura de la cookie de refresh.
Ninguna vista construye cookies a mano; todas pasan por aquí (OCP: cambiar la
política de SameSite/dominio es editar este archivo y nada más).

Por qué httpOnly (BUG-06):
    El refresh token es la credencial de larga vida (7 días). En localStorage
    cualquier XSS lo exfiltra y el atacante lo usa desde su propia máquina.
    En una cookie httpOnly JavaScript no puede leerlo: un XSS puede hacer
    peticiones mientras la víctima tiene la pestaña abierta, pero no se lleva
    la credencial.

Requisito de despliegue:
    SameSite=Lax solo envía la cookie si el frontend y la API comparten sitio.
    Eso se logra con el rewrite de Vercel (/api/* → Render). Si por lo que sea
    se sirve la API en otro sitio, hay que poner AUTH_COOKIE_SAMESITE=None
    (y entonces la defensa CSRF de SameSite desaparece — ver ADR en el README).
"""

from __future__ import annotations

from django.conf import settings

REFRESH_COOKIE_NAME = "sb_refresh"
#: Limita el envío de la cookie a los endpoints de auth (no viaja en cada request).
REFRESH_COOKIE_PATH = "/api/auth"


def _cookie_kwargs() -> dict:
    """Atributos comunes — derivados de settings, nunca hardcodeados."""
    return {
        "httponly": True,
        "secure": getattr(settings, "AUTH_COOKIE_SECURE", not settings.DEBUG),
        "samesite": getattr(settings, "AUTH_COOKIE_SAMESITE", "Lax"),
        "path": REFRESH_COOKIE_PATH,
    }


def set_refresh_cookie(response, refresh_token: str):
    """Emite el refresh token como cookie httpOnly. Devuelve la misma response."""
    max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=max_age,
        **_cookie_kwargs(),
    )
    return response


def clear_refresh_cookie(response):
    """Borra la cookie. Los atributos deben coincidir o el navegador la conserva."""
    response.delete_cookie(
        REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        samesite=getattr(settings, "AUTH_COOKIE_SAMESITE", "Lax"),
    )
    return response


def read_refresh_token(request) -> str | None:
    """Obtiene el refresh token exclusivamente desde la cookie httpOnly."""
    return request.COOKIES.get(REFRESH_COOKIE_NAME) or None
