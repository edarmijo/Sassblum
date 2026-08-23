"""Content and HTML integrity checks for transactional email templates."""

import re
from types import SimpleNamespace

import pytest
from django.template.loader import render_to_string


def _ticket_context(**overrides):
    context = {
        "recipient": SimpleNamespace(email="cuenta@example.com"),
        "recipient_nombre": "Victoria",
        "recipient_role": "client",
        "is_ticket_client": True,
        "tipo": "creacion",
        "ticket_numero": "T-2026-0001",
        "ticket_asunto": "No imprime",
        "ticket_descripcion": "La impresora no responde.",
        "cliente_nombre": "Victoria Pinto",
        "cliente_email": "contacto@example.com",
        "cliente_ruc": "0991234567001",
        "cliente_empresa": "SassBlum",
        "support_email": "notificaciones@sassblum.com",
        "support_phone": "",
        "support_whatsapp": "",
        "request_anydesk": False,
        "estado_anterior": "EnProceso",
        "estado_nuevo": "Resuelto",
        "comentario": "Equipo revisado y operativo.",
    }
    context.update(overrides)
    return context


def test_creation_email_guides_client_without_inventing_optional_channels():
    rendered = render_to_string("email/ticket_created.html", _ticket_context())

    assert "Siguientes pasos" in rendered
    assert "T-2026-0001" in rendered
    assert "capturas de pantalla" in rendered
    assert "Responda a este correo" in rendered
    assert "AnyDesk" not in rendered
    assert "Teléfono:" not in rendered
    assert "WhatsApp:" not in rendered


def test_creation_email_renders_only_configured_optional_channels():
    rendered = render_to_string(
        "email/ticket_created.html",
        _ticket_context(
            support_phone="04-000-0000",
            support_whatsapp="+593 99 000 0000",
            request_anydesk=True,
        ),
    )

    assert "AnyDesk" in rendered
    assert "Teléfono: 04-000-0000" in rendered
    assert "WhatsApp: +593 99 000 0000" in rendered


@pytest.mark.parametrize(
    ("state", "expected"),
    [
        ("Resuelto", "La solicitud fue atendida"),
        ("EnEspera", "La solicitud continúa en seguimiento"),
    ],
)
def test_status_email_includes_operational_context_and_closure(state, expected):
    rendered = render_to_string(
        "email/status_changed.html",
        _ticket_context(tipo="cambio_estado", estado_nuevo=state),
    )

    assert "Estimado(a)" in rendered
    assert "Observaciones/Solución" in rendered
    assert f"El estado actual de su ticket es <b>{state}</b>" in rendered
    assert expected in rendered
    assert "Soporte al usuario" in rendered


@pytest.mark.parametrize(
    "template_name",
    [
        "email/base_email.html",
        "email/ticket_created.html",
        "email/ticket_assigned.html",
        "email/status_changed.html",
        "email/password_reset.html",
        "email/email_verification.html",
    ],
)
def test_rendered_email_has_no_duplicate_style_attributes(template_name):
    rendered = render_to_string(template_name, _ticket_context())
    duplicate_style_tags = [
        tag
        for tag in re.findall(r"<[^>]+>", rendered)
        if len(re.findall(r"\bstyle\s*=", tag, flags=re.IGNORECASE)) > 1
    ]

    assert duplicate_style_tags == []
