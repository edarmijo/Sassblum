"""CSVExporter — Strategy for CSV (stdlib, always available). SOLID: SRP·LSP."""

from __future__ import annotations

import csv
import io

from apps.reports.interfaces import IReportExporter


class CSVExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
        return buffer.getvalue().encode("utf-8-sig")  # BOM for Excel-friendliness

    def get_extension(self) -> str:
        return "csv"

    def get_mime_type(self) -> str:
        return "text/csv"
