"""B11: cambio autenticado e invalidación efectiva de todas las sesiones."""

from __future__ import annotations

from collections.abc import Iterator
from unittest.mock import patch

import pytest
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.test import APIClient
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.cookies import REFRESH_COOKIE_NAME
from apps.authentication.models import User
from apps.authentication.services import AuthService, TokenService
from core.testing import random_credential

pytestmark = pytest.mark.django_db

CHANGE_URL = "/api/auth/cambiar-password"
CURRENT_PASSWORD = random_credential()


@pytest.fixture(autouse=True)
def clear_throttle_cache() -> Iterator[None]:
    cache.clear()
    yield
    cache.clear()


def make_user(role: str = User.Role.CLIENT, suffix: str = "client") -> User:
    return User.objects.create_user(
        email=f"change-{suffix}@example.com",
        password=CURRENT_PASSWORD,
        role=role,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )


def login(
    client: APIClient,
    user: User,
    password: str = CURRENT_PASSWORD,
) -> Response:
    return client.post(
        "/api/auth/login",
        {"email": user.email, "password": password},
        format="json",
    )


def change_payload(new_password: str) -> dict[str, str]:
    return {
        "current_password": CURRENT_PASSWORD,
        "new_password": new_password,
        "confirm_password": new_password,
    }


def test_change_requires_authentication(db: None) -> None:
    response = APIClient().post(CHANGE_URL, change_payload(random_credential()))
    assert response.status_code == 401


@pytest.mark.parametrize(
    ("role", "suffix"),
    [
        (User.Role.CLIENT, "client"),
        (User.Role.WORKER, "worker"),
        (User.Role.ADMIN, "admin"),
    ],
)
def test_every_authenticated_role_can_change_its_own_password(
    role: str,
    suffix: str,
) -> None:
    user = make_user(role, suffix)
    new_password = random_credential()
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(CHANGE_URL, change_payload(new_password), format="json")

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password(new_password)


def test_wrong_current_password_does_not_change_or_lock_account() -> None:
    user = make_user()
    client = APIClient()
    client.force_authenticate(user=user)
    payload = change_payload(random_credential())
    payload["current_password"] = random_credential()

    response = client.post(CHANGE_URL, payload, format="json")

    assert response.status_code == 400
    assert response.data["detail"] == "La contraseña actual es incorrecta."
    user.refresh_from_db()
    assert user.check_password(CURRENT_PASSWORD)
    assert user.intentos_fallidos == 0


def test_same_password_is_rejected_as_a_no_op() -> None:
    user = make_user()
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(CHANGE_URL, change_payload(CURRENT_PASSWORD), format="json")

    assert response.status_code == 400
    assert "diferente" in response.data["detail"]


@pytest.mark.parametrize("weak_password", ["1" * 8, "a" * 8, "A1" * 3])
def test_shared_password_policy_rejects_weak_values(weak_password: str) -> None:
    user = make_user()
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(CHANGE_URL, change_payload(weak_password), format="json")

    assert response.status_code == 400
    user.refresh_from_db()
    assert user.check_password(CURRENT_PASSWORD)


def test_shared_policy_accepts_unicode_letters_but_requires_an_ascii_digit() -> None:
    user = make_user()
    client = APIClient()
    client.force_authenticate(user=user)
    valid_password = f"Árbol1{random_credential()}"
    non_ascii_digit_password = f"Clave{'١' * 4}"

    rejected = client.post(
        CHANGE_URL,
        change_payload(non_ascii_digit_password),
        format="json",
    )
    accepted = client.post(CHANGE_URL, change_payload(valid_password), format="json")

    assert rejected.status_code == 400
    assert accepted.status_code == 200


def test_confirmation_must_match() -> None:
    user = make_user()
    client = APIClient()
    client.force_authenticate(user=user)
    payload = change_payload(random_credential())
    payload["confirm_password"] = random_credential()

    response = client.post(CHANGE_URL, payload, format="json")

    assert response.status_code == 400
    assert "confirm_password" in response.data


def test_password_change_rolls_back_if_server_side_revocation_fails() -> None:
    user = make_user()
    new_password = random_credential()

    with patch.object(
        TokenService,
        "invalidate_sessions",
        side_effect=RuntimeError("revocation unavailable"),
    ), pytest.raises(RuntimeError):
        AuthService().change_password(user, CURRENT_PASSWORD, new_password)

    user.refresh_from_db()
    assert user.check_password(CURRENT_PASSWORD)
    assert not user.check_password(new_password)


def test_success_revokes_access_refresh_cookie_and_old_credentials() -> None:
    user = make_user()
    new_password = random_credential()
    client = APIClient()
    login_response = login(client, user)
    assert login_response.status_code == 200
    old_access = login_response.data["tokens"]["access"]
    old_refresh = client.cookies[REFRESH_COOKIE_NAME].value
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_access}")

    response = client.post(CHANGE_URL, change_payload(new_password), format="json")

    assert response.status_code == 200
    assert response.cookies[REFRESH_COOKIE_NAME].value == ""
    assert not OutstandingToken.objects.filter(
        user=user,
        blacklistedtoken__isnull=True,
    ).exists()

    old_access_client = APIClient()
    old_access_client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_access}")
    assert old_access_client.get("/api/auth/perfil").status_code == 401

    old_refresh_client = APIClient()
    old_refresh_client.cookies[REFRESH_COOKIE_NAME] = old_refresh
    refresh_response = old_refresh_client.post("/api/auth/token/refresh", {}, format="json")
    assert refresh_response.status_code == 401
    assert refresh_response.cookies[REFRESH_COOKIE_NAME].value == ""

    assert login(APIClient(), user).status_code == 401
    assert login(APIClient(), user, new_password).status_code == 200


def test_pre_rollout_refresh_without_password_claim_is_rejected_cleanly() -> None:
    user = make_user()
    old_token = RefreshToken.for_user(user)
    del old_token[api_settings.REVOKE_TOKEN_CLAIM]
    old_refresh = str(old_token)

    client = APIClient()
    client.cookies[REFRESH_COOKIE_NAME] = old_refresh
    response = client.post("/api/auth/token/refresh", {}, format="json")

    assert response.status_code == 401
    assert response.cookies[REFRESH_COOKIE_NAME].value == ""


def test_sensitive_endpoint_is_throttled_per_authenticated_user() -> None:
    user = make_user()
    client = APIClient()
    client.force_authenticate(user=user)
    payload = change_payload(random_credential())
    payload["current_password"] = random_credential()

    responses = [client.post(CHANGE_URL, payload, format="json") for _ in range(6)]

    assert [response.status_code for response in responses[:5]] == [400] * 5
    assert responses[5].status_code == 429
