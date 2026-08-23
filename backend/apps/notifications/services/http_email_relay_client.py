"""HTTPS client for the cPanel email relay."""

from __future__ import annotations

from collections.abc import Callable
from urllib.parse import urlsplit

import requests

from apps.notifications.exceptions import (
    EmailRelayConfigurationError,
    EmailRelayDeliveryError,
)
from apps.notifications.interfaces.i_email_relay_client import (
    IEmailRelayClient,
    RelayDeliveryResult,
    RelayPayload,
)


class HttpEmailRelayClient(IEmailRelayClient):
    """POST one strict JSON payload to the configured HTTPS endpoint."""

    SECRET_HEADER = "X-SassBlum-Relay-Secret"
    USER_AGENT = "SassBlum-EmailRelay/1"
    MIN_SECRET_LENGTH = 32
    MAX_TIMEOUT_SECONDS = 60.0

    def __init__(
        self,
        relay_url: str,
        relay_secret: str,
        expected_host: str,
        timeout_seconds: float,
        session_factory: Callable[[], requests.Session] = requests.Session,
    ) -> None:
        self._relay_url = self._validate_url(relay_url, expected_host)
        self._relay_secret = self._validate_secret(relay_secret)
        self._timeout_seconds = self._validate_timeout(timeout_seconds)
        self._session_factory = session_factory

    def deliver(self, payload: RelayPayload) -> RelayDeliveryResult:
        """Send the payload without redirects or automatic retries."""
        headers = {
            self.SECRET_HEADER: self._relay_secret,
            "Accept": "application/json",
            "User-Agent": self.USER_AGENT,
        }
        try:
            with self._session_factory() as session:
                response = session.post(
                    self._relay_url,
                    json=payload,
                    headers=headers,
                    timeout=(self._timeout_seconds, self._timeout_seconds),
                    allow_redirects=False,
                )
        except requests.RequestException as exc:
            raise EmailRelayDeliveryError("No se pudo contactar al relay de correo.") from exc

        if response.status_code != 200:
            raise EmailRelayDeliveryError(
                f"El relay rechazó el envío con estado HTTP {response.status_code}."
            )
        content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            raise EmailRelayDeliveryError("El relay devolvió un tipo de contenido inesperado.")
        try:
            raw_result: object = response.json()
        except ValueError as exc:
            raise EmailRelayDeliveryError("El relay devolvió una respuesta JSON inválida.") from exc
        if not isinstance(raw_result, dict):
            raise EmailRelayDeliveryError("El relay devolvió una respuesta inválida.")

        status = raw_result.get("status")
        message_id = raw_result.get("message_id")
        if status not in ("sent", "duplicate") or message_id != payload["message_id"]:
            raise EmailRelayDeliveryError("El relay no confirmó el identificador del mensaje.")
        result: RelayDeliveryResult = {
            "status": status,
            "message_id": message_id,
        }
        return result

    @classmethod
    def _validate_url(cls, relay_url: str, expected_host: str) -> str:
        normalized = str(relay_url or "").strip()
        parsed = urlsplit(normalized)
        allowed_host = str(expected_host or "").strip().lower()
        try:
            port = parsed.port
        except ValueError as exc:
            raise EmailRelayConfigurationError(
                "La URL del relay contiene un puerto inválido."
            ) from exc
        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or parsed.username
            or parsed.password
            or parsed.query
            or parsed.fragment
            or parsed.hostname.lower() != allowed_host
            or port not in (None, 443)
        ):
            raise EmailRelayConfigurationError(
                "La URL del relay debe ser HTTPS y usar exactamente el host autorizado."
            )
        return normalized

    @classmethod
    def _validate_secret(cls, relay_secret: str) -> str:
        secret = str(relay_secret or "")
        if len(secret) < cls.MIN_SECRET_LENGTH or "\r" in secret or "\n" in secret:
            raise EmailRelayConfigurationError("El secreto del relay no cumple la longitud mínima.")
        return secret

    @classmethod
    def _validate_timeout(cls, timeout_seconds: float) -> float:
        timeout = float(timeout_seconds)
        if timeout <= 0 or timeout > cls.MAX_TIMEOUT_SECONDS:
            raise EmailRelayConfigurationError("El timeout del relay debe estar entre 0 y 60 segundos.")
        return timeout
