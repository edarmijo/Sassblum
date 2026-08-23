"""Database tests for historical report values and RUC filtering."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from django.test import override_settings

from apps.authentication.models import User
from apps.catalog.models import Service
from apps.reports.repositories import ReportRepository
from apps.tickets.models import Ticket


@pytest.fixture
def service(db) -> Service:
    return Service.objects.create(
        nombre="Soporte Técnico",
        descripcion="Servicio para probar reportería.",
        categoria="TI",
    )


@pytest.fixture
def client(db) -> User:
    return User.objects.create(
        email="perfil@example.com",
        first_name="Nombre",
        last_name="Actual",
        empresa="Empresa Actual",
        ruc="0111111111001",
        role=User.Role.CLIENT,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )


def create_ticket(
    *,
    numero: str,
    service: Service,
    client: User,
    contacto_nombre: str | None,
    contacto_empresa: str | None,
    contacto_ruc: str | None,
) -> Ticket:
    return Ticket.objects.create(
        numero=numero,
        asunto="Asunto histórico completo",
        descripcion="Descripción de prueba.",
        servicio=service,
        cliente=client,
        contacto_nombre=contacto_nombre,
        contacto_empresa=contacto_empresa,
        contacto_ruc=contacto_ruc,
    )


@pytest.mark.django_db
def test_rows_use_ticket_snapshot_instead_of_current_profile(
    service: Service,
    client: User,
) -> None:
    create_ticket(
        numero="T-LEG-1418",
        service=service,
        client=client,
        contacto_nombre="Contacto Histórico",
        contacto_empresa="Empresa Histórica",
        contacto_ruc="0992338547001",
    )

    row = ReportRepository().rows()[0]

    assert row["usuario"] == "Contacto Histórico"
    assert row["empresa"] == "Empresa Histórica"
    assert row["ruc"] == "0992338547001"
    assert row["asunto"] == "Asunto histórico completo"
    assert "cliente" not in row


@pytest.mark.django_db
@override_settings(TIME_ZONE="America/Guayaquil")
def test_rows_render_created_at_in_business_timezone(
    service: Service,
    client: User,
) -> None:
    ticket = create_ticket(
        numero="T-2026-9000",
        service=service,
        client=client,
        contacto_nombre=None,
        contacto_empresa=None,
        contacto_ruc=None,
    )
    Ticket.objects.filter(pk=ticket.pk).update(
        created_at=datetime(2026, 8, 23, 8, 24, tzinfo=UTC),
    )

    row = ReportRepository().rows()[0]

    assert row["creado_en"] == "2026-08-23 03:24"


@pytest.mark.django_db
def test_rows_fall_back_only_when_snapshot_is_null(
    service: Service,
    client: User,
) -> None:
    create_ticket(
        numero="T-2026-9001",
        service=service,
        client=client,
        contacto_nombre=None,
        contacto_empresa=None,
        contacto_ruc=None,
    )
    create_ticket(
        numero="T-2026-9002",
        service=service,
        client=client,
        contacto_nombre="",
        contacto_empresa="",
        contacto_ruc="",
    )

    rows = {row["numero"]: row for row in ReportRepository().rows()}

    assert rows["T-2026-9001"]["usuario"] == "Nombre Actual"
    assert rows["T-2026-9001"]["empresa"] == "Empresa Actual"
    assert rows["T-2026-9001"]["ruc"] == "0111111111001"
    assert rows["T-2026-9002"]["usuario"] == ""
    assert rows["T-2026-9002"]["empresa"] == ""
    assert rows["T-2026-9002"]["ruc"] == ""


@pytest.mark.django_db
def test_ruc_filter_uses_snapshot_with_profile_fallback(
    service: Service,
    client: User,
) -> None:
    create_ticket(
        numero="T-2026-9003",
        service=service,
        client=client,
        contacto_nombre="Histórico",
        contacto_empresa="Histórica",
        contacto_ruc="0999999999001",
    )
    create_ticket(
        numero="T-2026-9004",
        service=service,
        client=client,
        contacto_nombre=None,
        contacto_empresa=None,
        contacto_ruc=None,
    )
    create_ticket(
        numero="T-2026-9005",
        service=service,
        client=client,
        contacto_nombre="",
        contacto_empresa="",
        contacto_ruc="",
    )

    repository = ReportRepository()
    snapshot_matches = repository.rows({"cliente_ruc": "99999999"})
    fallback_matches = repository.rows({"cliente_ruc": "11111111"})

    assert [row["numero"] for row in snapshot_matches] == ["T-2026-9003"]
    assert [row["numero"] for row in fallback_matches] == ["T-2026-9004"]
