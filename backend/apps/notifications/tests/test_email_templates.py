"""Content and HTML integrity checks for transactional email templates."""

import re
from types import SimpleNamespace

import pytest
from django.template.loader import render_to_string

from apps.notifications.services.email_content_renderer import TemplateEmailContentRenderer


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


def test_creation_email_renders_confirmed_phone_without_whatsapp_or_anydesk():
    rendered = render_to_string(
        "email/ticket_created.html",
        _ticket_context(
            support_phone="+593 96 999 0990",
        ),
    )

    assert "Teléfono: +593 96 999 0990" in rendered
    assert "+593 99 528 6319" not in rendered
    assert "WhatsApp:" not in rendered
    assert "AnyDesk" not in rendered


@pytest.mark.parametrize(
    ("state", "expected"),
    [
        ("Resuelto", "Gracias por confiar en nosotros"),
        (
            "EnEspera",
            "Seguiremos trabajando en su requerimiento hasta satisfacer su necesidad",
        ),
    ],
)
def test_status_email_includes_operational_context_and_closure(state, expected):
    rendered = TemplateEmailContentRenderer().render(
        "email/status_changed.html",
        _ticket_context(tipo="cambio_estado", estado_nuevo=state),
    )

    for representation in (rendered.text, rendered.html):
        assert "Estimado(a)" in representation
        assert "Observaciones/Solución" in representation
        assert "El estado actual de su ticket es:" in representation
        assert state in representation
        assert expected in representation
        assert "Soporte al usuario" in representation


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


@pytest.mark.parametrize(
    ("template_name", "overrides", "required_content"),
    [
        (
            "email/ticket_created.html",
            {},
            (
                "Ticket de servicio creado",
                "Estimado(a)",
                "T-2026-0001",
                "Siguientes pasos",
                "capturas de pantalla",
                "Observación técnica",
                "Soporte al usuario",
            ),
        ),
        (
            "email/status_changed.html",
            {"tipo": "cambio_estado"},
            (
                "El estado de tu ticket cambió",
                "Observaciones/Solución",
                "Equipo revisado y operativo.",
                "Resuelto",
                "El estado actual de su ticket es:",
                "Gracias por confiar en nosotros",
                "Soporte al usuario",
            ),
        ),
        (
            "email/ticket_assigned.html",
            {},
            ("Tu ticket ha sido asignado", "T-2026-0001", "No imprime"),
        ),
        (
            "email/password_reset.html",
            {"reset_url": "https://app.example/reset/tökén", "expira_en": "1 hora"},
            (
                "Restablece tu contraseña",
                "https://app.example/reset/tökén",
                "1 hora",
                "solo puede usarse una vez",
            ),
        ),
        (
            "email/email_verification.html",
            {"verify_url": "https://app.example/verificar/tökén", "expira_en": "24 horas"},
            (
                "Confirma tu cuenta",
                "https://app.example/verificar/tökén",
                "24 horas",
                "solo puede usarse una vez",
            ),
        ),
    ],
)
def test_text_and_html_keep_the_same_operational_content(
    template_name, overrides, required_content
):
    context = _ticket_context(
        ticket_descripcion="Observación técnica: impresión detenida.",
        **overrides,
    )

    rendered = TemplateEmailContentRenderer().render(template_name, context)

    for expected in required_content:
        assert expected in rendered.text
        assert expected in rendered.html
    assert "Este es un mensaje automático de SassBlum." in rendered.text
    assert "Este es un mensaje automático de SassBlum." in rendered.html
