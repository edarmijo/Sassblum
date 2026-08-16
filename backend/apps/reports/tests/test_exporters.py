"""
Tests for report exporters + ExporterFactory (no database required).
Run: pytest apps/reports/tests/test_exporters.py -v
"""

from io import BytesIO

import pytest
from openpyxl import load_workbook

from apps.reports.exporters import ExcelExporter, PDFExporter
from core.factories.exporter_factory import ExporterFactory

ROWS = [
    {"numero": "T-2026-0001", "estado": "Nuevo", "prioridad": "Alta"},
    {"numero": "T-2026-0002", "estado": "Cerrado", "prioridad": "Baja"},
]
COLUMNS = ["numero", "estado", "prioridad"]


class TestExcelExporter:
    def test_extension_and_mime(self):
        exporter = ExcelExporter()
        assert exporter.get_extension() == "xlsx"
        assert exporter.get_mime_type() == (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    def test_export_includes_columns_and_rows(self):
        workbook = load_workbook(BytesIO(ExcelExporter().export(ROWS, COLUMNS)))
        values = list(workbook.active.values)

        assert values[0] == tuple(COLUMNS)
        assert values[1] == ("T-2026-0001", "Nuevo", "Alta")
        assert values[2] == ("T-2026-0002", "Cerrado", "Baja")


class TestExporterFactory:
    def test_build_excel(self):
        assert isinstance(ExporterFactory.build("excel"), ExcelExporter)

    def test_build_is_case_insensitive(self):
        assert isinstance(ExporterFactory.build("EXCEL"), ExcelExporter)

    def test_csv_is_no_longer_supported(self):
        with pytest.raises(ValueError, match="Formato no soportado"):
            ExporterFactory.build("csv")

    def test_unknown_format_raises(self):
        with pytest.raises(ValueError):
            ExporterFactory.build("xml")

    def test_pdf_and_excel_resolve_without_libs(self):
        # The classes resolve even if reportlab/openpyxl aren't installed;
        # the ImportError only surfaces when export() is called.
        assert ExporterFactory.build("pdf") is not None
        assert ExporterFactory.build("excel") is not None


class TestPDFExporter:
    def test_export_uses_landscape_letter_page(self):
        columns = [
            "numero", "asunto", "estado", "prioridad",
            "servicio", "cliente", "asignado", "creado_en",
        ]
        rows = [{column: f"Contenido extenso para {column} " * 4 for column in columns}]

        content = PDFExporter().export(rows, columns)

        assert content.startswith(b"%PDF-")
        assert b"/MediaBox [ 0 0 792 612 ]" in content

    def test_export_handles_multiple_pages_and_long_cells(self):
        columns = [
            "numero", "asunto", "estado", "prioridad",
            "servicio", "cliente", "asignado", "creado_en",
        ]
        rows = [
            {column: f"Fila {index}: valor largo de {column} " * 3 for column in columns}
            for index in range(80)
        ]

        content = PDFExporter().export(rows, columns)

        assert content.startswith(b"%PDF-")
        assert len(content) > 1_000
