"""
PDFExporter — Strategy for PDF via reportlab (lazy import). SOLID: SRP·LSP·OCP.
reportlab is imported inside export() so the module loads even if the lib is absent.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class PDFExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        try:
            from reportlab.lib.pagesizes import letter  # noqa: PLC0415
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle  # noqa: PLC0415
            from reportlab.lib import colors  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError("Instala reportlab para exportar a PDF.") from exc

        import io  # noqa: PLC0415
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        data = [columns] + [[str(r.get(c, "")) for c in columns] for r in rows]
        table = Table(data)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d1c1a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ]))
        doc.build([table])
        return buffer.getvalue()

    def get_extension(self) -> str:
        return "pdf"

    def get_mime_type(self) -> str:
        return "application/pdf"
