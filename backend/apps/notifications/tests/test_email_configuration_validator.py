"""Fail-fast checks for production email configuration."""

from dataclasses import replace

import pytest
from django.core.exceptions import ImproperlyConfigured

from apps.notifications.validators import EmailConfiguration, EmailConfigurationValidator


@pytest.fixture
def valid_smtp_configuration() -> EmailConfiguration:
    return EmailConfiguration(
        debug=False,
        backend="django.core.mail.backends.smtp.EmailBackend",
        from_email="notificaciones@sassblum.com",
        reply_to=("notificaciones@sassblum.com",),
        cc=("notificaciones@sassblum.com",),
        host="smtp.example.com",
        username="smtp-user",
        password="smtp-password",
        use_tls=True,
    )


def test_valid_smtp_configuration_passes(valid_smtp_configuration):
    EmailConfigurationValidator().validate(valid_smtp_configuration)


def test_debug_configuration_skips_delivery_requirements(valid_smtp_configuration):
    configuration = replace(
        valid_smtp_configuration,
        debug=True,
        backend="django.core.mail.backends.console.EmailBackend",
        from_email="",
        reply_to=(),
        cc=(),
        host="",
        username="",
        password="",
    )

    EmailConfigurationValidator().validate(configuration)


@pytest.mark.parametrize(
    ("changes", "expected"),
    [
        ({"backend": "django.core.mail.backends.locmem.EmailBackend"}, "proveedor"),
        ({"from_email": "invalid"}, "DEFAULT_FROM_EMAIL"),
        ({"reply_to": ()}, "EMAIL_REPLY_TO"),
        ({"cc": ()}, "EMAIL_CC"),
        ({"password": ""}, "EMAIL_HOST_PASSWORD"),
        ({"use_ssl": True}, "simultáneamente"),
        (
            {"backend": "anymail.backends.brevo.EmailBackend", "brevo_api_key": ""},
            "BREVO_API_KEY",
        ),
    ],
)
def test_invalid_production_configuration_fails(
    valid_smtp_configuration, changes, expected
):
    configuration = replace(valid_smtp_configuration, **changes)
    validator = EmailConfigurationValidator()

    with pytest.raises(ImproperlyConfigured, match=expected):
        validator.validate(configuration)
