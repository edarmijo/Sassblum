"""Regression tests for the historical client contact stored on each ticket."""

from unittest.mock import patch

import pytest

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.tickets.models import Ticket, TicketEvent
from apps.tickets.services.ticket_service import TicketService
from core.testing import random_credential

TEST_PASSWORD = random_credential()


@pytest.fixture
def service(db) -> Service:
    return Service.objects.create(
        nombre="Soporte",
        descripcion="Servicio para pruebas del snapshot.",
        categoria="TI",
    )


@pytest.fixture
def cliente(db) -> User:
    return User.objects.create_user(
        email="contacto@example.com",
        password=TEST_PASSWORD,
        first_name="Victoria",
        last_name="Pinto",
        ruc="0999999999001",
        empresa="SassBlum",
        role=User.Role.CLIENT,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )


def create_ticket(service: Service, cliente: User) -> dict:
    return TicketService().create_ticket(
        {
            "asunto": "Problema con el equipo",
            "descripcion": "El equipo dejó de responder durante la jornada de trabajo.",
            "servicio_id": service.id,
            "prioridad": Ticket.Prioridad.ALTA,
            "adjuntos": [],
        },
        cliente,
    )


@pytest.mark.django_db
def test_new_ticket_keeps_contact_after_profile_changes(
    service: Service,
    cliente: User,
) -> None:
    created = create_ticket(service, cliente)
    ticket = Ticket.objects.get(pk=created["id"])

    assert ticket.contacto_nombre == "Victoria Pinto"
    assert ticket.contacto_email == "contacto@example.com"
    assert ticket.contacto_ruc == "0999999999001"
    assert ticket.contacto_empresa == "SassBlum"

    cliente.first_name = "Nombre"
    cliente.last_name = "Nuevo"
    cliente.ruc = "0111111111001"
    cliente.empresa = "Empresa Nueva"
    cliente.save(update_fields=["first_name", "last_name", "ruc", "empresa"])

    ticket.refresh_from_db()
    detail = TicketService().get_ticket_detail(ticket.id, cliente)

    assert ticket.contacto_nombre == "Victoria Pinto"
    assert ticket.contacto_email == "contacto@example.com"
    assert ticket.contacto_ruc == "0999999999001"
    assert ticket.contacto_empresa == "SassBlum"
    assert detail["cliente_nombre"] == "Victoria Pinto"
    assert detail["cliente_email"] == "contacto@example.com"


@pytest.mark.django_db
def test_pre_b1_ticket_falls_back_to_current_profile(
    service: Service,
    cliente: User,
) -> None:
    ticket = Ticket.objects.create(
        numero="T-2026-9001",
        asunto="Ticket anterior",
        descripcion="Este ticket fue creado antes de existir el snapshot.",
        servicio=service,
        cliente=cliente,
    )

    assert ticket.contacto_nombre is None
    assert ticket.contacto_email is None
    assert ticket.contacto_ruc is None
    assert ticket.contacto_empresa is None
    assert ticket.contacto_nombre_efectivo == "Victoria Pinto"
    assert ticket.contacto_email_efectivo == "contacto@example.com"
    assert ticket.contacto_ruc_efectivo == "0999999999001"
    assert ticket.contacto_empresa_efectiva == "SassBlum"


@pytest.mark.django_db
def test_known_empty_snapshot_does_not_fall_back_to_profile(
    service: Service,
    cliente: User,
) -> None:
    ticket = Ticket.objects.create(
        numero="T-2026-9002",
        asunto="Contacto histórico vacío",
        descripcion="Los valores vacíos son información histórica conocida.",
        servicio=service,
        cliente=cliente,
        contacto_nombre="",
        contacto_email="",
        contacto_ruc="",
        contacto_empresa="",
    )

    assert ticket.contacto_nombre_efectivo == ""
    assert ticket.contacto_email_efectivo == ""
    assert ticket.contacto_ruc_efectivo == ""
    assert ticket.contacto_empresa_efectiva == ""


@pytest.mark.django_db
def test_future_event_payload_uses_corrected_ticket_contact(
    service: Service,
    cliente: User,
) -> None:
    created = create_ticket(service, cliente)
    ticket = Ticket.objects.get(pk=created["id"])
    ticket.contacto_nombre = "Contacto Corregido"
    ticket.contacto_email = "corregido@example.com"
    ticket.contacto_ruc = "0111111111001"
    ticket.contacto_empresa = "Empresa Corregida"
    ticket.save(update_fields=[
        "contacto_nombre",
        "contacto_email",
        "contacto_ruc",
        "contacto_empresa",
    ])

    with patch("apps.notifications.services.get_notification_service") as get_service:
        TicketEvent.objects.create(
            ticket=ticket,
            autor=cliente,
            tipo_evento=TicketEvent.TipoEvento.COMENTARIO,
            comentario="Evento posterior a la corrección del contacto.",
        )

    payload = get_service.return_value.dispatch.call_args.args[0]
    assert payload["cliente_email"] == "corregido@example.com"
    assert payload["cliente_nombre"] == "Contacto Corregido"
    assert payload["cliente_ruc"] == "0111111111001"
    assert payload["cliente_empresa"] == "Empresa Corregida"
    assert payload["cliente_id"] == cliente.id
    assert payload["asignado_id"] is None
