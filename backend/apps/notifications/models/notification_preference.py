"""
NotificationPreference model — per-user channel preferences (SRP).

Responsibility (SRP): store which channels a user wants enabled. Nothing more.
    NotificationService reads this to decide which strategies to invoke.
Depends on: Django ORM, authentication.User.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new channel = new boolean field)

One row per user (OneToOne). Defaults: all channels enabled.
"""

from django.db import models


class NotificationPreference(models.Model):

    usuario = models.OneToOneField(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="preferencias_notificacion",
        verbose_name="usuario",
    )
    email_activo = models.BooleanField(default=True, verbose_name="email activo")
    in_app_activo = models.BooleanField(default=True, verbose_name="in-app activo")
    ws_activo = models.BooleanField(default=True, verbose_name="websocket activo")

    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizada en")

    class Meta:
        db_table = "notifications_preference"

    def __str__(self) -> str:
        canales = []
        if self.email_activo:
            canales.append("email")
        if self.in_app_activo:
            canales.append("in_app")
        if self.ws_activo:
            canales.append("ws")
        return f"Prefs user {self.usuario_id}: {', '.join(canales) or 'ninguno'}"
