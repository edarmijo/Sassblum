"""Fail-fast validation for production email configuration."""

from __future__ import annotations

from dataclasses import dataclass

from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.validators import validate_email


@dataclass(frozen=True)
class EmailConfiguration:
    """Values needed to validate common and provider-specific email settings."""

    debug: bool
    backend: str
    from_email: str
    reply_to: tuple[str, ...]
    cc: tuple[str, ...]
    host: str = ""
    username: str = ""
    password: str = ""
    use_tls: bool = False
    use_ssl: bool = False
    brevo_api_key: str = ""


class EmailConfigurationValidator:
    """Validate production delivery without coupling B4 to a future relay backend."""

    _NON_DELIVERY_BACKENDS = frozenset({
        "django.core.mail.backends.console.EmailBackend",
        "django.core.mail.backends.locmem.EmailBackend",
        "django.core.mail.backends.dummy.EmailBackend",
    })
    _SMTP_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    _BREVO_BACKEND = "anymail.backends.brevo.EmailBackend"

    def validate(self, configuration: EmailConfiguration) -> None:
        """Raise ``ImproperlyConfigured`` for an unusable production setup."""
        if configuration.debug:
            return
        if not configuration.backend or configuration.backend in self._NON_DELIVERY_BACKENDS:
            raise ImproperlyConfigured(
                "EMAIL_BACKEND debe configurar un proveedor de entrega en producción."
            )

        self._validate_address(configuration.from_email, "DEFAULT_FROM_EMAIL")
        self._validate_address_list(configuration.reply_to, "EMAIL_REPLY_TO")
        self._validate_address_list(configuration.cc, "EMAIL_CC")

        if configuration.backend == self._SMTP_BACKEND:
            if not configuration.host or not configuration.username or not configuration.password:
                raise ImproperlyConfigured(
                    "EMAIL_HOST, EMAIL_HOST_USER y EMAIL_HOST_PASSWORD son obligatorios para SMTP."
                )
            if configuration.use_tls and configuration.use_ssl:
                raise ImproperlyConfigured(
                    "EMAIL_USE_TLS y EMAIL_USE_SSL no pueden habilitarse simultáneamente."
                )
        elif (
            configuration.backend == self._BREVO_BACKEND
            and not configuration.brevo_api_key
        ):
            raise ImproperlyConfigured(
                "BREVO_API_KEY es obligatoria al usar el backend de Brevo."
            )

    @staticmethod
    def _validate_address(value: str, setting_name: str) -> None:
        try:
            validate_email(value)
        except ValidationError as exc:
            raise ImproperlyConfigured(
                f"{setting_name} debe contener un correo válido."
            ) from exc

    @classmethod
    def _validate_address_list(
        cls,
        values: tuple[str, ...],
        setting_name: str,
    ) -> None:
        if not values:
            raise ImproperlyConfigured(
                f"{setting_name} es obligatorio en producción."
            )
        for value in values:
            cls._validate_address(value, setting_name)
