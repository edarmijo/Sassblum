"""
Tests for apps/realtime/auth.py — WS handshake authentication helpers.

Solo se prueban las funciones síncronas (no requieren BD ni async):
  · _extract_token   — extrae el JWT del subprotocolo o de ?token= (fallback)
  · negotiated_subprotocol — indica qué subprotocolo confirmar al aceptar

La función resolve_user (async + BD) queda cubierta por integración manual
(smoke test en DevTools → Network → WS después del despliegue).
"""

import pytest

from apps.realtime.auth import (
    JWT_SUBPROTOCOL,
    _extract_token,
    negotiated_subprotocol,
)


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
