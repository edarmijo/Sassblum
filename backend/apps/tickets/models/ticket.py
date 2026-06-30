"""
Ticket model — defines data structure only (SRP).

Responsibility (SRP): persist ticket data. No business logic.
    - Estado transitions live in TicketStateMachine (state_machine/).
    - T-YYYY-NNNN number generation lives in TicketService (services/).
    - Validation lives in the validator chain (validators/).
Depends on: Django ORM, apps.authentication.models.User, apps.catalog.models.Service.
Pattern: Domain Model (data-only).
SOLID: SRP (model = data; logic = service)

Prohibited in this file:
    - Methods that call other services
    - Pre/post-save hooks (use apps.py ready() for signals)
    - Any reference to TicketService, TicketStateMachine, or NotificationService

Permitted in this file:
    - Field definitions and choices
    - clean() for field-level constraints only (e.g. asunto length)
    - Simple @property for derived display values (e.g. is_closed)
"""

from django.db import models


class Ticket(models.Model):

    class Estado(models.TextChoices):
        NUEVO      = "Nuevo",     "Nuevo"
        EN_PROCESO = "EnProceso", "En Proceso"
        EN_ESPERA  = "EnEspera",  "En Espera"
        RESUELTO   = "Resuelto",  "Resuelto"
        CERRADO    = "Cerrado",   "Cerrado"

    class Prioridad(models.TextChoices):
        BAJA    = "Baja",    "Baja"
        MEDIA   = "Media",   "Media"
        ALTA    = "Alta",    "Alta"
        CRITICA = "Critica", "Crítica"

    # ── Identity ──────────────────────────────────────────────────────────────
    numero = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="número de ticket",
        help_text="Formato T-YYYY-NNNN. Generado por TicketService, nunca por el modelo.",
    )

    # ── Content ───────────────────────────────────────────────────────────────
    asunto = models.CharField(
        max_length=80,
        verbose_name="asunto",
    )
    descripcion = models.TextField(
        verbose_name="descripción",
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    servicio = models.ForeignKey(
        "catalog.Service",
        on_delete=models.PROTECT,
        related_name="tickets",
        verbose_name="servicio",
    )
    cliente = models.ForeignKey(
        "authentication.User",
        on_delete=models.PROTECT,
        related_name="tickets_creados",
        verbose_name="cliente",
    )
    asignado = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_asignados",
        verbose_name="trabajador asignado",
    )

    # ── Status ────────────────────────────────────────────────────────────────
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.NUEVO,
        verbose_name="estado",
    )
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.MEDIA,
        verbose_name="prioridad",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "tickets_ticket"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["cliente", "estado"]),
            models.Index(fields=["asignado", "estado"]),
            models.Index(fields=["estado", "prioridad"]),
        ]

    def __str__(self) -> str:
        return f"{self.numero} — {self.asunto[:40]}"

    @property
    def is_closed(self) -> bool:
        """True if ticket has reached the terminal Cerrado state."""
        return self.estado == self.Estado.CERRADO
