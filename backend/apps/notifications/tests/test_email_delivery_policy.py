"""Addressing rules for ticket-contact and account email identities."""

from apps.notifications.policies import EmailDeliveryPolicy

from .test_strategies import make_user


def test_ticket_client_uses_effective_contact_and_deduplicated_cc(settings):
    settings.EMAIL_REPLY_TO = ["Soporte@SassBlum.com", "soporte@sassblum.com"]
    settings.EMAIL_CC = ["contacto@example.com", "audit@sassblum.com"]
    context = {
        "tipo": "creacion",
        "cliente_id": 5,
        "cliente_email": "contacto@example.com",
    }

    result = EmailDeliveryPolicy().resolve(make_user(id=5), context)

    assert result is not None
    assert result.to == ("contacto@example.com",)
    assert result.cc == ("audit@sassblum.com",)
    assert result.reply_to == ("Soporte@SassBlum.com",)
    assert result.is_ticket_client is True


def test_ticket_staff_uses_account_email_without_cc(settings):
    settings.EMAIL_REPLY_TO = ["soporte@sassblum.com"]
    settings.EMAIL_CC = ["audit@sassblum.com"]
    context = {
        "tipo": "comentario",
        "cliente_id": 5,
        "cliente_email": "contacto@example.com",
    }

    result = EmailDeliveryPolicy().resolve(
        make_user(id=7, email="worker@sassblum.com"), context
    )

    assert result is not None
    assert result.to == ("worker@sassblum.com",)
    assert result.cc == ()
    assert result.reply_to == ("soporte@sassblum.com",)
    assert result.is_ticket_client is False


def test_auth_email_uses_account_without_ticket_headers(settings):
    settings.EMAIL_REPLY_TO = ["soporte@sassblum.com"]
    settings.EMAIL_CC = ["audit@sassblum.com"]

    result = EmailDeliveryPolicy().resolve(
        make_user(email="account@example.com"), {"tipo": "password_reset"}
    )

    assert result is not None
    assert result.to == ("account@example.com",)
    assert result.cc == ()
    assert result.reply_to == ()


def test_empty_effective_client_contact_has_no_safe_destination():
    context = {"tipo": "creacion", "cliente_id": 5, "cliente_email": ""}

    assert EmailDeliveryPolicy().resolve(make_user(id=5), context) is None
