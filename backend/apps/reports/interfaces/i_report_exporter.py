"""
IReportExporter — root contract for report export formats.

Responsibility (SRP): declare how a set of rows becomes a downloadable file.
Pattern: Strategy (each format is an exporter) + DIP anchor.
SOLID: DIP · OCP · LSP

OCP: JSONExporter = new class implementing this + one entry in ExporterFactory.
    PDFExporter / CSVExporter / ExcelExporter are never modified.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IReportExporter(ABC):

    @abstractmethod
    def export(self, rows: list[dict], columns: list[str]) -> bytes:
        """Serialize rows (list of dicts) into the format's bytes."""
        ...

    @abstractmethod
    def get_extension(self) -> str:
        """File extension without the dot, e.g. 'csv'."""
        ...

    @abstractmethod
    def get_mime_type(self) -> str:
        """MIME type for the HTTP response."""
        ...
