"""
Tests for report exporters + ExporterFactory (no database required).
Run: pytest apps/reports/tests/test_exporters.py -v
"""

import pytest

from apps.reports.exporters import CSVExporter
from core.factories.exporter_factory import ExporterFactory

ROWS = [
    {"numero": "T-2026-0001", "estado": "Nuevo", "prioridad": "Alta"},
    {"numero": "T-2026-0002", "estado": "Cerrado", "prioridad": "Baja"},
]
COLUMNS = ["numero", "estado", "prioridad"]


class TestCSVExporter:
    def test_export_includes_header_and_rows(self):
        content = CSVExporter().export(ROWS, COLUMNS).decode("utf-8-sig")
        assert "numero,estado,prioridad" in content
        assert "T-2026-0001,Nuevo,Alta" in content
        assert "T-2026-0002,Cerrado,Baja" in content

    def test_extension_and_mime(self):
        exp = CSVExporter()
        assert exp.get_extension() == "csv"
        assert exp.get_mime_type() == "text/csv"

    def test_ignores_extra_keys(self):
        rows = [{"numero": "X", "estado": "Y", "prioridad": "Z", "extra": "ignored"}]
        content = CSVExporter().export(rows, COLUMNS).decode("utf-8-sig")
        assert "ignored" not in content


class TestExporterFactory:
    def test_build_csv(self):
        assert isinstance(ExporterFactory.build("csv"), CSVExporter)

    def test_build_is_case_insensitive(self):
        assert isinstance(ExporterFactory.build("CSV"), CSVExporter)

    def test_unknown_format_raises(self):
        with pytest.raises(ValueError):
            ExporterFactory.build("xml")

    def test_pdf_and_excel_resolve_without_libs(self):
        # The classes resolve even if reportlab/openpyxl aren't installed;
        # the ImportError only surfaces when export() is called.
        assert ExporterFactory.build("pdf") is not None
        assert ExporterFactory.build("excel") is not None
