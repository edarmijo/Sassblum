"""Regression tests for the customer ticket-created email."""

from django.template.loader import render_to_string
from django.test import override_settings


def test_ticket_created_email_contains_dynamic_ticket_and_customer_instructions():
    with override_settings(
        SASSBLUM_CONTACT_PHONE="0991234567",
        SASSBLUM_CONTACT_EMAIL="soporte@sassblum.com",
        SASSBLUM_CONTACT_HOURS="Lunes a viernes, 08:00 a 17:00",
    ):
        html = render_to_string(
            "email/ticket_created.html",
            {
                "recipient": type("Recipient", (), {"email": "cliente@example.com"})(),
                "recipient_nombre": "Cliente de prueba",
                "cliente_email": "cliente@example.com",
                "cliente_nombre": "Cliente de prueba",
                "cliente_ruc": "0999999999001",
                "cliente_empresa": "Empresa de prueba",
                "ticket_numero": "T-2026-0125",
                "ticket_asunto": "No puedo ingresar",
                "ticket_descripcion": "La pantalla muestra un error.",
                "contact_phone": "0991234567",
                "contact_email": "soporte@sassblum.com",
                "contact_hours": "Lunes a viernes, 08:00 a 17:00",
            },
        )

    assert "T-2026-0125" in html
    assert "No puedo ingresar" in html
    assert "La pantalla muestra un error." in html
    assert "0991234567" in html
    assert "soporte@sassblum.com" in html
    assert "capturas de pantalla" in html
    assert "número de ticket" in html
