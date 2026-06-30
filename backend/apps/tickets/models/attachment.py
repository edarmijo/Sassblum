"""
Attachment model — stores file metadata for ticket attachments (SRP).

Responsibility (SRP): persist file reference data only.
    - Actual file upload/delete lives in StorageService (via IStorageService).
    - The URL stored here is returned by IStorageService.upload().
    - Attachment records are created by TicketService after a successful upload.
Depends on: Django ORM, Ticket model.
Pattern: Domain Model (data-only).
SOLID: SRP

Prohibited in this file:
    - Any call to IStorageService or Supabase SDK
    - File I/O of any kind
"""

from django.db import models


class Attachment(models.Model):

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="adjuntos",
        verbose_name="ticket",
    )
    nombre_archivo = models.CharField(
        max_length=255,
        verbose_name="nombre del archivo",
    )
    url = models.URLField(
        max_length=1000,
        verbose_name="URL de acceso",
        help_text="URL pública o firmada retornada por IStorageService.upload().",
    )
    tamaño_bytes = models.PositiveIntegerField(
        verbose_name="tamaño (bytes)",
    )
    mime_type = models.CharField(
        max_length=100,
        verbose_name="tipo MIME",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="subido en")

    class Meta:
        db_table = "tickets_attachment"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.nombre_archivo} ({self.ticket.numero})"
