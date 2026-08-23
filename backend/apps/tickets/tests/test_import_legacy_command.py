"""Regression and safety coverage for the B7 historical-ticket import."""

from __future__ import annotations

import hashlib
import json
from io import StringIO
from pathlib import Path
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.tickets.management.commands.import_legacy import (
    CORRECTED_DULCENAC_RUC,
    Command,
    clean_rows,
    is_legacy_spam,
    normalize_ruc,
    parse_sql_rows,
)
from apps.tickets.models import Ticket, TicketEvent
from apps.tickets.services.ticket_service import TicketService


def legacy_row(
    codigo: int,
    *,
    fecha: str = "2025-01-02 03:04:05",
    usuario: str = "Vicky Pinto",
    email: str = "vicky@example.com",
    ruc: str = "0999999999001",
    empresa: str = "SassBlum",
    asunto: str = "Soporte",
    mensaje: str = "Necesito ayuda técnica",
    solucion: str = "Caso solucionado",
    estado: str = "Resuelto",
) -> list[str | None]:
    return [
        str(codigo),
        fecha,
        usuario,
        email,
        ruc,
        empresa,
        asunto,
        mensaje,
        solucion,
        estado,
    ]


def mysql_literal(value: str | None) -> str:
    if value is None:
        return "NULL"
    escaped = value.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{escaped}'"


def write_dump(path: Path, rows: list[list[str | None]]) -> str:
    values = ",\n".join(
        "(" + ",".join(mysql_literal(value) for value in row) + ")"
        for row in rows
    )
    contents = f"SET NAMES utf8mb4;\nINSERT INTO `tickets` VALUES\n{values};\n"
    path.write_text(contents, encoding="utf-8")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_parser_preserves_utf8_escaped_quotes_and_null() -> None:
    sql = (
        "INSERT INTO `tickets` VALUES "
        "('1000','2025-01-02 03:04:05','María O\\'Brien',"
        "'maria@example.com','0999999999001','Compañía',NULL,'Línea\\n2','',"
        "'Abierto');"
    )

    rows = parse_sql_rows(sql, "tickets")

    assert len(rows) == 1
    assert rows[0][2] == "María O'Brien"
    assert rows[0][6] is None
    assert rows[0][7] == "Línea\n2"


def test_clean_rows_omits_only_invalid_email_without_truncating_subject() -> None:
    long_subject = "A" * 100
    analysis = clean_rows([
        legacy_row(1001, email="asasa", ruc="asas", estado=""),
        legacy_row(1418, asunto=long_subject),
    ])

    assert [row["codigo"] for row in analysis.rows] == [1418]
    assert analysis.rows[0]["asunto"] == long_subject
    assert [issue.as_dict() for issue in analysis.omitted] == [{
        "codigo": 1001,
        "categoria": "email_invalido",
        "detalle": "email inválido 'asasa'",
        "omitido": True,
    }]


def test_clean_rows_reports_duplicate_legacy_code() -> None:
    analysis = clean_rows([
        legacy_row(1000),
        legacy_row(1000, email="second@example.com"),
    ])

    assert len(analysis.rows) == 1
    assert analysis.omitted[0].codigo == 1000
    assert analysis.omitted[0].categoria == "codigo_duplicado"


def test_ruc_rules_are_traceable_and_never_fabricate_missing_digits() -> None:
    normalized, rules = normalize_ruc("09992338547001")
    short, short_rules = normalize_ruc("1236588")
    separated, separated_rules = normalize_ruc("0992338547001 ·\t")

    assert normalized == CORRECTED_DULCENAC_RUC
    assert rules == ["corregir_9_sobrante_dulcenac"]
    assert short == "1236588"
    assert short_rules == []
    assert separated == CORRECTED_DULCENAC_RUC
    assert separated_rules == ["quitar_espacios_tabs_punto_medio"]


@pytest.mark.parametrize(
    ("ruc", "subject", "message", "expected"),
    [
        ("keywords", "keywords", "Get more traffic from Google", True),
        ("RfdwcvHeWNIATpVMkxhiR", "fhlEbTGYLPUngHFFsB", "random", True),
        ("0992338547001 ·", "AGREGAR MAS IMPRESIONES", "Ayuda", False),
    ],
)
def test_spam_detection_matches_audited_legacy_shapes(
    ruc: str, subject: str, message: str, expected: bool
) -> None:
    assert is_legacy_spam(ruc, subject, message) is expected


def test_real_import_requires_explicit_guards() -> None:
    with pytest.raises(CommandError, match="--confirm-import"):
        call_command("import_legacy", file="missing.sql")


def test_invalid_utf8_is_rejected(tmp_path: Path) -> None:
    dump_path = tmp_path / "invalid.sql"
    dump_path.write_bytes(b"\xff\xfe")

    with pytest.raises(CommandError, match="no es UTF-8 válido"):
        call_command("import_legacy", file=dump_path, dry_run=True)


@pytest.mark.django_db
def test_import_preserves_snapshots_spam_latest_profile_and_is_idempotent(
    tmp_path: Path,
) -> None:
    long_subject = "Solicitud histórica " + ("x" * 82)
    rows = [
        legacy_row(
            1000,
            fecha="2024-01-02 03:04:05",
            usuario="Contacto Antiguo",
            email="shared@example.com",
            ruc="09992338547001",
            empresa="DULCENAC",
            asunto=long_subject,
            solucion="Solución histórica completa",
        ),
        legacy_row(
            1001,
            email="asasa",
            ruc="asas",
            estado="",
        ),
        legacy_row(
            1002,
            fecha="2025-02-03 04:05:06",
            usuario="Contacto Reciente",
            email="shared@example.com",
            ruc="0992338547001 ·",
            empresa="DULCENAC S.A.",
            estado="Abierto",
        ),
        legacy_row(
            1297,
            usuario="8054002077",
            email="spam@example.com",
            ruc="keywords",
            empresa="8054002077",
            asunto="keywords",
            mensaje="Get more traffic from Google",
        ),
    ]
    dump_path = tmp_path / "legacy.sql"
    source_hash = write_dump(dump_path, rows)
    first_manifest = tmp_path / "manifest-first.json"
    stdout = StringIO()

    with (
        patch("apps.notifications.services.get_notification_service") as notify,
        patch(
            "apps.realtime.events.ticket_events.broadcast_ticket_updated"
        ) as broadcast,
    ):
        call_command(
            "import_legacy",
            file=dump_path,
            confirm_import=True,
            confirm_backup=True,
            confirm_omissions=True,
            expected_sha256=source_hash,
            manifest=first_manifest,
            stdout=stdout,
        )
    notify.assert_not_called()
    broadcast.assert_not_called()

    assert Ticket.objects.count() == 3
    assert not Ticket.objects.filter(legacy_codigo=1001).exists()
    older = Ticket.objects.get(legacy_codigo=1000)
    newer = Ticket.objects.get(legacy_codigo=1002)
    spam = Ticket.objects.get(legacy_codigo=1297)
    assert older.asunto == long_subject
    assert older.contacto_nombre == "Contacto Antiguo"
    assert older.contacto_email == "shared@example.com"
    assert older.contacto_ruc == CORRECTED_DULCENAC_RUC
    assert older.contacto_ruc_original == "09992338547001"
    assert newer.contacto_nombre == "Contacto Reciente"
    assert newer.contacto_ruc == CORRECTED_DULCENAC_RUC
    assert spam.legacy_es_spam is True
    assert spam.contacto_ruc == ""
    assert spam.contacto_ruc_original == "keywords"
    assert older.created_at.year == 2024

    shared_user = User.objects.get(email="shared@example.com")
    assert shared_user.first_name == "Contacto"
    assert shared_user.last_name == "Reciente"
    assert shared_user.ruc == CORRECTED_DULCENAC_RUC
    assert shared_user.ruc_original == "0992338547001 ·"
    assert shared_user.empresa == "DULCENAC S.A."
    assert shared_user.estado == User.Estado.PENDING
    assert shared_user.email_verificado is False

    legacy_event = TicketEvent.objects.get(ticket=older)
    assert legacy_event.autor is None
    assert legacy_event.autor_nombre == "Sistema (migración histórica)"
    assert legacy_event.tipo_evento == TicketEvent.TipoEvento.COMENTARIO
    assert "fecha de solución no disponible" in legacy_event.comentario
    assert "Solución histórica completa" in legacy_event.comentario

    detail = TicketService().get_ticket_detail(older.id, shared_user)
    assert detail["eventos"][0]["autor_nombre"] == "Sistema (migración histórica)"

    api_client = APIClient()
    api_client.force_authenticate(user=shared_user)
    history_response = api_client.get(f"/api/tickets/{older.id}/historial")
    assert history_response.status_code == 200
    assert history_response.data[0]["autor_nombre"] == "Sistema (migración histórica)"

    first_data = json.loads(first_manifest.read_text(encoding="utf-8"))
    assert first_data["conciliacion"] == {
        "leidos": 4,
        "importables": 3,
        "omitidos": 1,
        "marcados_spam": 1,
        "clientes_unicos": 2,
        "codigo_minimo": 1000,
        "codigo_maximo": 1297,
        "estados_legados": {"(vacío)": 1, "Abierto": 1, "Resuelto": 2},
    }
    assert first_data["omitidos"][0]["codigo"] == 1001
    assert first_data["omitidos"][0]["categoria"] == "email_invalido"
    assert first_data["resultado"]["tickets_creados"] == 3
    assert first_data["resultado"]["usuarios_creados"] == 2

    second_manifest = tmp_path / "manifest-second.json"
    call_command(
        "import_legacy",
        file=dump_path,
        confirm_import=True,
        confirm_backup=True,
        confirm_omissions=True,
        expected_sha256=source_hash,
        manifest=second_manifest,
        stdout=StringIO(),
    )

    assert Ticket.objects.count() == 3
    assert TicketEvent.objects.count() == 3
    second_data = json.loads(second_manifest.read_text(encoding="utf-8"))
    assert second_data["resultado"]["tickets_creados"] == 0
    assert second_data["resultado"]["tickets_existentes"] == 3
    assert second_data["resultado"]["usuarios_creados"] == 0


@pytest.mark.django_db
def test_dry_run_database_comparison_is_read_only(tmp_path: Path) -> None:
    dump_path = tmp_path / "legacy.sql"
    write_dump(dump_path, [legacy_row(1000)])
    manifest_path = tmp_path / "manifest.json"

    call_command(
        "import_legacy",
        file=dump_path,
        dry_run=True,
        compare_database=True,
        manifest=manifest_path,
        stdout=StringIO(),
    )

    assert Ticket.objects.count() == 0
    assert User.objects.count() == 0
    result = json.loads(manifest_path.read_text(encoding="utf-8"))["resultado"]
    assert result == {
        "modo": "dry-run con comparación BD",
        "usuarios_crear": 1,
        "usuarios_existentes": 0,
        "tickets_crear": 1,
        "tickets_existentes": 0,
    }


def test_manifest_does_not_overwrite_without_explicit_flag(tmp_path: Path) -> None:
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text("original", encoding="utf-8")

    with pytest.raises(CommandError, match="ya existe"):
        Command._write_manifest_if_requested(
            {"version_manifiesto": 1},
            {"manifest": str(manifest_path), "overwrite_manifest": False},
        )

    assert manifest_path.read_text(encoding="utf-8") == "original"


@pytest.mark.django_db
def test_manifest_failure_rolls_back_the_real_import(tmp_path: Path) -> None:
    dump_path = tmp_path / "legacy.sql"
    source_hash = write_dump(dump_path, [legacy_row(1000)])
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text("do not replace", encoding="utf-8")
    stdout = StringIO()

    with pytest.raises(CommandError, match="ya existe"):
        call_command(
            "import_legacy",
            file=dump_path,
            confirm_import=True,
            confirm_backup=True,
            confirm_omissions=True,
            expected_sha256=source_hash,
            manifest=manifest_path,
            stdout=stdout,
        )

    assert Ticket.objects.count() == 0
    assert User.objects.count() == 0
    assert manifest_path.read_text(encoding="utf-8") == "do not replace"
