"""
TicketEvent model — immutable audit log for all ticket activity (SRP).

Responsibility (SRP): persist audit records only. Every state change, comment,
    and assignment creates one TicketEvent. The model never decides when to create
    records — that logic lives in TicketService.
Depends on: Django ORM, Ticket model, authentication.User.
Pattern: Domain Model (data-only) + Observer (this model's post_save fires the signal
    registered in apps.py ready() — the model itself knows nothing about it).
SOLID: SRP · OCP (new event type = new TipoEvento choice, no logic change)

Prohibited in this file:
    - Any call to NotificationService, EmailService, or WebSocket
    - pre/post_save hooks (signals live in apps.py)
    - Mutable state or update logic (TicketEvents are append-only)

BR-35 enforcement:
    The comentario field is required for CAMBIO_ESTADO events.
    This constraint is enforced by TicketService + TicketStateMachine, NOT by the model.
    The model accepts any non-null string to remain flexible for other event types.
"""

from django.db import models


class TicketEvent(models.Model):

    class TipoEvento(models.TextChoices):
        CREACION      = "creacion",      "Creación"
        CAMBIO_ESTADO = "cambio_estado", "Cambio de estado"
        COMENTARIO    = "comentario",    "Comentario"
        ASIGNACION    = "asignacion",    "Asignación"
        REASIGNACION  = "reasignacion",  "Reasignación"

    # ── Relations ─────────────────────────────────────────────────────────────
    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="eventos",
        verbose_name="ticket",
    )
    autor = models.ForeignKey(
        "authentication.User",
        on_delete=models.PROTECT,
        related_name="ticket_events",
        verbose_name="autor",
    )

    # ── Event data ────────────────────────────────────────────────────────────
    tipo_evento = models.CharField(
        max_length=20,
        choices=TipoEvento.choices,
        verbose_name="tipo de evento",
    )
    estado_anterior = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="estado anterior",
        help_text="Vacío para eventos que no cambian estado (comentarios, asignaciones).",
    )
    estado_nuevo = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="estado nuevo",
    )
    comentario = models.TextField(
        verbose_name="comentario",
        help_text="Requerido para CAMBIO_ESTADO (BR-35). Opcional para otros tipos.",
    )

    # ── Timestamp (immutable) ─────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="registrado en")

    class Meta:
        db_table = "tickets_ticket_event"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["ticket", "created_at"]),
            models.Index(fields=["ticket", "tipo_evento"]),
        ]

    def __str__(self) -> str:
        return (
            f"{self.ticket.numero} · {self.tipo_evento} "
            f"({self.created_at.strftime('%Y-%m-%d %H:%M')})"
        )
