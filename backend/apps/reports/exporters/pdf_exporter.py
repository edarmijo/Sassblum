"""
PDFExporter — Strategy for PDF via reportlab (lazy import). SOLID: SRP·LSP·OCP.
reportlab is imported inside export() so the module loads even if the lib is absent.
"""

from __future__ import annotations

from apps.reports.interfaces import IReportExporter


class PDFExporter(IReportExporter):

    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        try:
            from reportlab.lib import colors  # noqa: PLC0415
            from reportlab.lib.pagesizes import landscape, letter  # noqa: PLC0415
            from reportlab.lib.styles import ParagraphStyle  # noqa: PLC0415
            from reportlab.platypus import (  # noqa: PLC0415
                Paragraph,
                SimpleDocTemplate,
                LongTable,
                TableStyle,
            )
        except ImportError as exc:
            raise RuntimeError("Instala reportlab para exportar a PDF.") from exc

        import io  # noqa: PLC0415
        from xml.sax.saxutils import escape  # noqa: PLC0415

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            leftMargin=24,
            rightMargin=24,
            topMargin=24,
            bottomMargin=24,
        )
        header_style = ParagraphStyle(
            "ReportHeader",
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=8,
            textColor=colors.white,
        )
        cell_style = ParagraphStyle(
            "ReportCell",
            fontName="Helvetica",
            fontSize=6.5,
            leading=8,
            textColor=colors.HexColor("#1d1c1a"),
        )
        data = [
            [Paragraph(escape(str(column)), header_style) for column in columns],
            *[
                [
                    Paragraph(escape(str(row.get(column, ""))), cell_style)
                    for column in columns
                ]
                for row in rows
            ],
        ]
        width_weights = {
            "numero": 0.10,
            "creado_en": 0.10,
            "usuario": 0.12,
            "empresa": 0.12,
            "ruc": 0.10,
            "asunto": 0.15,
            "estado": 0.08,
            "prioridad": 0.07,
            "servicio": 0.09,
            "asignado": 0.07,
        }
        weights = [width_weights.get(column, 1 / len(columns)) for column in columns]
        total_weight = sum(weights)
        column_widths = [doc.width * weight / total_weight for weight in weights]
        table = LongTable(
            data,
            colWidths=column_widths,
            repeatRows=1,
            hAlign="LEFT",
        )
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d1c1a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
        ]))
        doc.build([table])
        return buffer.getvalue()

    def get_extension(self) -> str:
        return "pdf"

    def get_mime_type(self) -> str:
        return "application/pdf"
