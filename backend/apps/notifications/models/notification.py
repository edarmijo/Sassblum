"""
Notification model — stores one in-app notification record (SRP).

Responsibility (SRP): persist notification data only. It does NOT decide whether
    to send — that logic lives in NotificationService. The model only stores.
Depends on: Django ORM, authentication.User.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new tipo = new choice, no logic change)

A partial index on unread notifications accelerates the badge counter query
(get_unread_count) used by NotificationBell on the frontend.
"""

from django.db import models


class Notification(models.Model):

    class Tipo(models.TextChoices):
        CREACION      = "creacion",      "Creación"
        CAMBIO_ESTADO = "cambio_estado", "Cambio de estado"
        COMENTARIO    = "comentario",    "Comentario"
        ASIGNACION    = "asignacion",    "Asignación"
        REASIGNACION  = "reasignacion",  "Reasignación"
        INFORMACION   = "informacion",   "Información"

    usuario = models.ForeignKey(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="notificaciones",
        verbose_name="usuario",
    )
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.INFORMACION,
        verbose_name="tipo",
    )
    titulo = models.CharField(max_length=160, verbose_name="título")
    cuerpo = models.TextField(verbose_name="cuerpo")
    leida = models.BooleanField(default=False, verbose_name="leída")
    payload = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="payload",
        help_text="Datos del evento original (ticket_numero, estados, etc.).",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creada en")

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]
        indexes = [
            # Partial index: solo notificaciones no leídas (acelera el contador del badge)
            models.Index(
                fields=["usuario"],
                condition=models.Q(leida=False),
                name="notif_unread_by_user_idx",
            ),
            models.Index(fields=["usuario", "created_at"]),
        ]

    def __str__(self) -> str:
        estado = "•" if not self.leida else " "
        return f"{estado} {self.titulo} → user {self.usuario_id}"
