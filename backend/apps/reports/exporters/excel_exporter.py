"""
ExcelExporter — Strategy for .xlsx via openpyxl (lazy import). SOLID: SRP·LSP·OCP.
openpyxl is imported inside export() so the module loads even if the lib is absent;
a clear error is raised only when an Excel export is actually requested.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class ExcelExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        try:
            from openpyxl import Workbook  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError("Instala openpyxl para exportar a Excel.") from exc

        import io  # noqa: PLC0415
        wb = Workbook()
        ws = wb.active
        ws.append(columns)
        for row in rows:
            ws.append([row.get(c, "") for c in columns])
        buffer = io.BytesIO()
        wb.save(buffer)
        return buffer.getvalue()

    def get_extension(self) -> str:
        return "xlsx"

    def get_mime_type(self) -> str:
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
