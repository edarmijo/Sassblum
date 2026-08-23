"""Adaptador UAPI de cPanel para buzones corporativos (B15)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import requests
from django.conf import settings

from apps.authentication.interfaces import (
    IMailboxProvider,
    MailboxProviderRejected,
    MailboxProviderUnavailable,
)


class CpanelMailboxProvider(IMailboxProvider):
    """Cliente HTTPS estricto; no registra token, payload ni respuesta completa."""

    def __init__(
        self,
        host: str,
        username: str,
        api_token: str,
        quota_mb: int,
        timeout_seconds: int = 10,
    ) -> None:
        self._base_url = f"https://{host}:2083/execute/Email"
        self._authorization = f"cpanel {username}:{api_token}"
        self._quota_mb = quota_mb
        self._timeout = timeout_seconds

    def mailbox_exists(self, email: str) -> bool:
        data = self._request("list_pops")
        normalized = email.strip().lower()
        if not isinstance(data, list):
            raise MailboxProviderUnavailable(
                "cPanel devolvió una respuesta inesperada al consultar buzones."
            )
        return any(self._mailbox_email(item) == normalized for item in data)

    def create_mailbox(self, email: str, credential: str) -> None:
        local_part, domain = self._split_email(email)
        self._request(
            "add_pop",
            {
                "email": local_part,
                "domain": domain,
                "password": credential,
                "quota": self._quota_mb,
            },
        )

    def rotate_credential(self, email: str, credential: str) -> None:
        _, domain = self._split_email(email)
        self._request(
            "passwd_pop",
            {
                "email": email,
                "domain": domain,
                "password": credential,
            },
        )

    def _request(
        self,
        function: str,
        data: Mapping[str, object] | None = None,
    ) -> object:
        try:
            response = requests.post(
                f"{self._base_url}/{function}",
                data=data,
                headers={
                    "Authorization": self._authorization,
                    "Accept": "application/json",
                },
                timeout=self._timeout,
                allow_redirects=False,
            )
        except requests.RequestException as exc:
            raise MailboxProviderUnavailable(
                "No se pudo confirmar la operación con cPanel."
            ) from exc

        if response.status_code in {401, 403}:
            raise MailboxProviderRejected(
                "cPanel rechazó la autenticación del proveedor de buzones."
            )
        if response.is_redirect or response.status_code >= 400:
            raise MailboxProviderUnavailable(
                "cPanel no pudo procesar la operación de buzón."
            )

        try:
            payload: Any = response.json()
        except ValueError as exc:
            raise MailboxProviderUnavailable(
                "cPanel devolvió una respuesta no válida."
            ) from exc

        result = payload.get("result") if isinstance(payload, dict) else None
        if not isinstance(result, dict):
            raise MailboxProviderUnavailable(
                "cPanel devolvió una respuesta incompleta."
            )
        if result.get("status") != 1:
            raise MailboxProviderRejected(
                "cPanel rechazó la operación de buzón."
            )
        return result.get("data")

    @staticmethod
    def _mailbox_email(item: object) -> str:
        if not isinstance(item, dict):
            return ""
        value = item.get("email") or item.get("email_utf8") or ""
        normalized = str(value).strip().lower()
        domain = str(item.get("domain") or "").strip().lower()
        if normalized and "@" not in normalized and domain:
            return f"{normalized}@{domain}"
        return normalized

    @staticmethod
    def _split_email(email: str) -> tuple[str, str]:
        local_part, separator, domain = email.strip().lower().rpartition("@")
        if separator != "@" or not local_part or not domain:
            raise MailboxProviderRejected("El correo corporativo no es válido.")
        return local_part, domain


def build_mailbox_provider() -> IMailboxProvider | None:
    """Factory de infraestructura: desactivado por defecto y sustituible en tests."""
    if not settings.CPANEL_MAILBOX_ENABLED:
        return None
    return CpanelMailboxProvider(
        host=settings.CPANEL_HOST,
        username=settings.CPANEL_USERNAME,
        api_token=settings.CPANEL_API_TOKEN,
        quota_mb=settings.CPANEL_MAILBOX_QUOTA_MB,
        timeout_seconds=settings.CPANEL_TIMEOUT_SECONDS,
    )
