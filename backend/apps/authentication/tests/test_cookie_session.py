"""
Tests del flujo de sesión por cookie httpOnly (BUG-06, paso 2).

Cubre el contrato que el frontend asume:
  login  → emite cookie httpOnly con el refresh token
  refresh→ funciona SOLO con la cookie (sin refresh en el body)
  refresh→ devuelve el usuario, para no persistir sesión en disco
  logout → borra la cookie y tolera un access token vencido

Run: pytest apps/authentication/tests/test_cookie_session.py -v
"""

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.authentication.cookies import REFRESH_COOKIE_NAME
from apps.authentication.models import User
from core.testing import random_credential

pytestmark = pytest.mark.django_db

TEST_PASSWORD = random_credential()


@pytest.fixture
def active_user(db):
    return User.objects.create_user(
        email="cookie-user@example.com", password=TEST_PASSWORD,
        role=User.Role.CLIENT, estado=User.Estado.ACTIVE, email_verificado=True,
    )


@pytest.fixture
def client():
    return APIClient()


def _login(client):
    return client.post(
        "/api/auth/login",
        {"email": "cookie-user@example.com", "password": TEST_PASSWORD},
        format="json",
    )


# ── login ─────────────────────────────────────────────────────────────────────

def test_login_sets_httponly_refresh_cookie(active_user, client):
    res = _login(client)

    assert res.status_code == 200
    cookie = res.cookies.get(REFRESH_COOKIE_NAME)
    assert cookie is not None, "login debe emitir la cookie de refresh"
    assert cookie["httponly"], "la cookie DEBE ser httpOnly (inaccesible a JS)"
    assert cookie["path"] == "/api/auth", "la cookie no debe viajar en cada request"
    assert cookie.value, "la cookie debe contener el refresh token"


@override_settings(AUTH_COOKIE_SAMESITE="None", AUTH_COOKIE_SECURE=True)
def test_cookie_policy_can_be_overridden_for_an_explicit_cross_site_deployment(active_user, client):
    """SameSite=None solo se habilita de forma explícita y siempre con Secure."""
    res = _login(client)

    cookie = res.cookies[REFRESH_COOKIE_NAME]
    assert cookie["samesite"] == "None"
    assert cookie["secure"], "SameSite=None sin Secure es rechazado por el navegador"
    assert cookie["httponly"]


# ── refresh ───────────────────────────────────────────────────────────────────

def test_refresh_works_with_cookie_only(active_user, client):
    """El caso que importa: rehidratar sin que el cliente guarde nada en disco."""
    _login(client)  # APIClient conserva las cookies entre peticiones

    res = client.post("/api/auth/token/refresh", {}, format="json")

    assert res.status_code == 200, "la cookie por sí sola debe bastar"
    assert res.data["access"], "debe devolver un access token nuevo"
    assert res.data["user"]["email"] == "cookie-user@example.com", (
        "debe devolver el usuario para no persistirlo en localStorage"
    )


def test_refresh_rotates_the_cookie(active_user, client):
    _login(client)
    first = client.cookies[REFRESH_COOKIE_NAME].value

    res = client.post("/api/auth/token/refresh", {}, format="json")

    assert res.status_code == 200
    assert res.cookies[REFRESH_COOKIE_NAME].value != first, (
        "ROTATE_REFRESH_TOKENS=True debe emitir un refresh nuevo"
    )


def test_refresh_without_session_returns_401(db, client):
    res = client.post("/api/auth/token/refresh", {}, format="json")

    assert res.status_code == 401


def test_refresh_with_garbage_cookie_clears_it(db, client):
    client.cookies[REFRESH_COOKIE_NAME] = "no-es-un-token"

    res = client.post("/api/auth/token/refresh", {}, format="json")

    assert res.status_code == 401
    # delete_cookie deja la cookie con valor vacío para que el navegador la purgue.
    assert res.cookies[REFRESH_COOKIE_NAME].value == ""


def test_refresh_rejects_body_token_without_cookie(active_user, client):
    """El refresh nunca se acepta desde un body legible por JavaScript."""
    login = _login(client)
    body_refresh = login.cookies[REFRESH_COOKIE_NAME].value
    client.cookies.clear()

    res = client.post(
        "/api/auth/token/refresh", {"refresh": body_refresh}, format="json"
    )

    assert res.status_code == 401


def test_tokens_are_not_exposed_in_response_bodies(active_user, client):
    login = _login(client)
    assert "refresh" not in login.data["tokens"]

    refresh = client.post("/api/auth/token/refresh", {}, format="json")
    assert refresh.status_code == 200
    assert "refresh" not in refresh.data


# ── logout ────────────────────────────────────────────────────────────────────

def test_logout_clears_cookie_and_returns_200(active_user, client):
    _login(client)

    res = client.post("/api/auth/logout", {}, format="json")

    assert res.status_code == 200
    assert res.cookies[REFRESH_COOKIE_NAME].value == ""


def test_logout_tolerates_expired_access_token(active_user, client):
    """Cerrar sesión con un token vencido debe funcionar, no dar 401 (BUG-02)."""
    _login(client)
    client.credentials(HTTP_AUTHORIZATION="Bearer token.completamente.invalido")

    res = client.post("/api/auth/logout", {}, format="json")

    assert res.status_code == 200


def test_logout_without_any_session_returns_200(db, client):
    res = client.post("/api/auth/logout", {}, format="json")

    assert res.status_code == 200
