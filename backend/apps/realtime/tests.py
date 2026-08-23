"""
Tests for apps/realtime/auth.py — WS handshake authentication helpers.

Solo se prueban las funciones síncronas (no requieren BD ni async):
  · _extract_token   — extrae el JWT del subprotocolo o de ?token= (fallback)
  · negotiated_subprotocol — indica qué subprotocolo confirmar al aceptar

La función resolve_user (async + BD) queda cubierta por integración manual
(smoke test en DevTools → Network → WS después del despliegue).
"""

from unittest.mock import AsyncMock, patch

import pytest
from asgiref.sync import async_to_sync

from apps.authentication.models import User
from apps.authentication.services import AuthService
from apps.authentication.signals import password_sessions_revoked
from apps.realtime.auth import (
    JWT_SUBPROTOCOL,
    _extract_token,
    negotiated_subprotocol,
    resolve_user,
)
from apps.realtime.consumers.notification_consumer import NotificationConsumer
from apps.realtime.consumers.ticket_consumer import TicketConsumer
from apps.realtime.events.session_events import session_group
from core.testing import random_credential


# ── _extract_token ─────────────────────────────────────────────────────────────

class TestExtractToken:

    def _scope(self, subprotocols=None, query_string=b""):
        return {"subprotocols": subprotocols or [], "query_string": query_string}

    def test_returns_token_from_subprotocol(self):
        scope = self._scope(subprotocols=[JWT_SUBPROTOCOL, "mytoken123"])
        assert _extract_token(scope) == "mytoken123"

    def test_subprotocol_takes_precedence_over_querystring(self):
        scope = self._scope(
            subprotocols=[JWT_SUBPROTOCOL, "subproto_token"],
            query_string=b"token=qs_token",
        )
        assert _extract_token(scope) == "subproto_token"

    def test_falls_back_to_query_string_when_no_subprotocol(self):
        scope = self._scope(query_string=b"token=qs_token")
        assert _extract_token(scope) == "qs_token"

    def test_returns_none_when_subprotocol_present_but_no_token_after(self):
        scope = self._scope(subprotocols=[JWT_SUBPROTOCOL])
        assert _extract_token(scope) is None

    def test_returns_none_when_nothing_provided(self):
        scope = self._scope()
        assert _extract_token(scope) is None

    def test_ignores_unrelated_subprotocols(self):
        scope = self._scope(subprotocols=["other.proto"])
        assert _extract_token(scope) is None

    def test_handles_missing_query_string_key(self):
        scope = self._scope(query_string=b"foo=bar")
        assert _extract_token(scope) is None


# ── negotiated_subprotocol ────────────────────────────────────────────────────

class TestNegotiatedSubprotocol:

    def _scope(self, subprotocols=None):
        return {"subprotocols": subprotocols or []}

    def test_returns_jwt_subprotocol_when_offered(self):
        scope = self._scope(subprotocols=[JWT_SUBPROTOCOL, "sometoken"])
        assert negotiated_subprotocol(scope) == JWT_SUBPROTOCOL

    def test_returns_none_when_not_offered(self):
        scope = self._scope(subprotocols=["other.protocol"])
        assert negotiated_subprotocol(scope) is None

    def test_returns_none_when_empty(self):
        assert negotiated_subprotocol(self._scope()) is None


class TestPasswordSessionRevocation:

    @pytest.mark.django_db(transaction=True)
    def test_websocket_handshake_rejects_access_after_password_change(self) -> None:
        user = User.objects.create_user(
            email="ws-revoke@example.com",
            password=random_credential(),
            role=User.Role.CLIENT,
            estado=User.Estado.ACTIVE,
            email_verificado=True,
        )
        access = AuthService().generate_tokens(user)["access"]
        scope = {
            "subprotocols": [JWT_SUBPROTOCOL, access],
            "query_string": b"",
        }

        assert async_to_sync(resolve_user)(scope).pk == user.pk
        user.set_password(random_credential())
        user.save(update_fields=["password"])
        assert async_to_sync(resolve_user)(scope) is None

    def test_auth_signal_is_observed_by_realtime(self) -> None:
        with patch(
            "apps.realtime.events.session_events.broadcast_session_revoked"
        ) as broadcast:
            password_sessions_revoked.send(sender=AuthService, user_id=17)

        broadcast.assert_called_once_with(17)

    @pytest.mark.parametrize("consumer_class", [NotificationConsumer, TicketConsumer])
    def test_live_consumers_close_on_session_revocation(
        self,
        consumer_class: type[NotificationConsumer] | type[TicketConsumer],
    ) -> None:
        consumer = consumer_class()
        consumer.close = AsyncMock()

        async_to_sync(consumer.session_revoked)({"type": "session.revoked"})

        consumer.close.assert_awaited_once_with(code=4401)

    def test_session_group_is_stable_per_user(self) -> None:
        assert session_group(17) == "session_user_17"
