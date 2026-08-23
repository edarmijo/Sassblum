"""ReportService contract tests for legacy-compatible column order."""

from __future__ import annotations

from unittest.mock import patch

from apps.reports.services import ReportService


EXPECTED_COLUMNS = [
    "numero", "creado_en", "usuario", "empresa", "ruc",
    "asunto", "estado", "prioridad", "servicio", "asignado",
]


class StubRepository:
    def rows(self, filters: dict | None = None) -> list[dict]:
        return [{"numero": "T-2026-0001"}]

    def summary(self, filters: dict | None = None) -> dict:
        return {"total": 1}


class CapturingExporter:
    def __init__(self) -> None:
        self.columns: list[str] = []

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        self.columns = columns
        return b"report"

    def get_extension(self) -> str:
        return "test"

    def get_mime_type(self) -> str:
        return "application/test"


def test_export_uses_legacy_columns_first_and_additive_columns_after() -> None:
    exporter = CapturingExporter()
    service = ReportService(repository=StubRepository())

    with patch("apps.reports.services.report_service.ExporterFactory.build", return_value=exporter):
        content, mime, filename = service.export("test")

    assert exporter.columns == EXPECTED_COLUMNS
    assert content == b"report"
    assert mime == "application/test"
    assert filename == "reporte_tickets.test"
