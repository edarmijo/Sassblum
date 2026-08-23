"""Serialize Django email messages into the strict relay contract."""

from __future__ import annotations

import json
from email.utils import parseaddr
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.core.mail.message import EmailMessage
from django.core.validators import validate_email

from apps.notifications.exceptions import EmailRelayPayloadError
from apps.notifications.interfaces.i_email_relay_client import RelayPayload


class RelayMessageSerializer:
    """Validate and serialize the subset of email features SassBlum uses."""

    CONTRACT_VERSION = 1
    MAX_RECIPIENTS = 50
    MAX_SUBJECT_CHARS = 998
    DEFAULT_MAX_PAYLOAD_BYTES = 262_144

    def __init__(
        self,
        expected_from_email: str,
        max_payload_bytes: int = DEFAULT_MAX_PAYLOAD_BYTES,
    ) -> None:
        self._expected_from_email = self._normalize_single_address(expected_from_email)
        if max_payload_bytes <= 0:
            raise EmailRelayPayloadError("El tamaño máximo del relay debe ser mayor que cero.")
        self._max_payload_bytes = max_payload_bytes

    def serialize(self, message: EmailMessage) -> RelayPayload:
        """Return a safe payload without sender or arbitrary headers."""
        self._validate_sender(message.from_email)
        subject = self._validate_subject(message.subject)
        recipients = self._normalize_addresses(message.to, required=True)
        cc = self._normalize_addresses(message.cc)
        reply_to = self._normalize_addresses(message.reply_to)

        if len(recipients) + len(cc) + len(reply_to) > self.MAX_RECIPIENTS:
            raise EmailRelayPayloadError("El correo supera el límite de destinatarios permitido.")
        if message.bcc:
            raise EmailRelayPayloadError("El relay no admite destinatarios BCC.")
        if message.attachments:
            raise EmailRelayPayloadError("El relay no admite archivos adjuntos.")
        if message.extra_headers:
            raise EmailRelayPayloadError("El relay no admite cabeceras arbitrarias.")

        text_body = str(message.body or "")
        html_body = self._extract_html_body(message)
        if not text_body and not html_body:
            raise EmailRelayPayloadError("El correo debe contener texto o HTML.")

        payload: RelayPayload = {
            "version": self.CONTRACT_VERSION,
            "message_id": str(uuid4()),
            "subject": subject,
            "to": recipients,
            "cc": cc,
            "reply_to": reply_to,
            "text_body": text_body,
            "html_body": html_body,
        }
        encoded = json.dumps(
            payload,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        if len(encoded) > self._max_payload_bytes:
            raise EmailRelayPayloadError("El correo supera el tamaño máximo permitido.")
        return payload

    def _validate_sender(self, from_email: str) -> None:
        actual = self._normalize_single_address(from_email)
        if actual.casefold() != self._expected_from_email.casefold():
            raise EmailRelayPayloadError("El remitente no coincide con el autorizado.")

    @classmethod
    def _validate_subject(cls, subject: str) -> str:
        normalized = str(subject or "").strip()
        if not normalized:
            raise EmailRelayPayloadError("El asunto del correo es obligatorio.")
        if "\r" in normalized or "\n" in normalized:
            raise EmailRelayPayloadError("El asunto contiene caracteres no permitidos.")
        if len(normalized) > cls.MAX_SUBJECT_CHARS:
            raise EmailRelayPayloadError("El asunto supera el tamaño máximo permitido.")
        return normalized

    @classmethod
    def _normalize_addresses(
        cls,
        addresses: list[str] | tuple[str, ...] | None,
        required: bool = False,
    ) -> list[str]:
        normalized = [cls._normalize_single_address(value) for value in (addresses or [])]
        if required and not normalized:
            raise EmailRelayPayloadError("El correo requiere al menos un destinatario.")
        if len(set(address.casefold() for address in normalized)) != len(normalized):
            raise EmailRelayPayloadError("El correo contiene destinatarios duplicados.")
        return normalized

    @staticmethod
    def _normalize_single_address(value: str) -> str:
        raw = str(value or "").strip()
        if "\r" in raw or "\n" in raw:
            raise EmailRelayPayloadError("Una dirección contiene caracteres no permitidos.")
        _, address = parseaddr(raw)
        if not address:
            raise EmailRelayPayloadError("Se encontró una dirección de correo vacía.")
        try:
            validate_email(address)
        except ValidationError as exc:
            raise EmailRelayPayloadError("Se encontró una dirección de correo inválida.") from exc
        return address

    @staticmethod
    def _extract_html_body(message: EmailMessage) -> str:
        html_body = ""
        alternatives = getattr(message, "alternatives", ())
        for alternative in alternatives:
            content = str(alternative.content)
            mimetype = str(alternative.mimetype).lower()
            if mimetype != "text/html":
                raise EmailRelayPayloadError("El relay sólo admite la alternativa text/html.")
            if html_body:
                raise EmailRelayPayloadError("El relay admite una sola alternativa HTML.")
            html_body = content
        return html_body
