"""CSVExporter — Strategy for UTF-8 CSV report exports."""

from __future__ import annotations

import csv
import io

from apps.reports.exporters.spreadsheet_cell import spreadsheet_safe_value
from apps.reports.interfaces import IReportExporter


class CSVExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        buffer = io.StringIO(newline="")
        writer = csv.writer(buffer, lineterminator="\r\n")
        writer.writerow(columns)
        for row in rows:
            writer.writerow([
                spreadsheet_safe_value(row.get(column, ""))
                for column in columns
            ])
        return buffer.getvalue().encode("utf-8-sig")

    def get_extension(self) -> str:
        return "csv"

    def get_mime_type(self) -> str:
        return "text/csv; charset=utf-8"
