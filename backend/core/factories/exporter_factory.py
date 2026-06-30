"""
ExporterFactory — maps a format string to an IReportExporter (Factory, OCP).

Responsibility (SRP): know which exporter serves each format. Does not export.
SOLID: OCP · SRP · DIP.

OCP: JSONExporter = new class + one entry in FORMAT_MAP. ReportService unchanged.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class ExporterFactory:

    @staticmethod
    def build(fmt: str) -> IReportExporter:
        from apps.reports.exporters import CSVExporter, PDFExporter, ExcelExporter  # noqa: PLC0415

        FORMAT_MAP = {
            "csv": CSVExporter,
            "pdf": PDFExporter,
            "excel": ExcelExporter,
            "xlsx": ExcelExporter,
        }
        exporter_class = FORMAT_MAP.get(fmt.lower())
        if exporter_class is None:
            raise ValueError(
                f"Formato no soportado: '{fmt}'. Disponibles: {list(FORMAT_MAP)}"
            )
        return exporter_class()
