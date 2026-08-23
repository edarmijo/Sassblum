"""
ReportService — orchestrates report data + export (Singleton + DIP).

Responsibility (SRP): combine ReportRepository data with the exporter chosen by
    ExporterFactory. Depends on IReportExporter (abstraction), never on a concrete
    exporter class (DIP). SOLID: Singleton · DIP · OCP.
"""

from __future__ import annotations

import threading

from apps.reports.repositories import ReportRepository
from core.factories.exporter_factory import ExporterFactory

_COLUMNS = [
    "numero", "creado_en", "usuario", "empresa", "ruc",
    "asunto", "estado", "prioridad", "servicio", "asignado",
]


class ReportService:

    def __init__(self, repository: ReportRepository | None = None) -> None:
        self._repo = repository or ReportRepository()

    def get_dashboard(self, filters: dict | None = None) -> dict:
        return self._repo.summary(filters)

    def export(self, fmt: str, filters: dict | None = None) -> tuple[bytes, str, str]:
        """Return (content_bytes, mime_type, filename) for the requested format."""
        exporter = ExporterFactory.build(fmt)  # raises ValueError on unknown format
        rows = self._repo.rows(filters)
        content = exporter.export(rows, _COLUMNS)
        filename = f"reporte_tickets.{exporter.get_extension()}"
        return content, exporter.get_mime_type(), filename


_lock = threading.Lock()
_instance: ReportService | None = None


def get_report_service() -> ReportService:
    global _instance  # noqa: PLW0603
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = ReportService()
    return _instance
