"""Persistent logo for a real SassBlum customer (SRP: data only)."""

from django.db import models


class ClientLogo(models.Model):
    """A logo shown in the public clients carousel and managed by an admin."""

    nombre = models.CharField(max_length=120, unique=True, verbose_name="nombre")
    logo_url = models.URLField(
        max_length=500, blank=True, default="", verbose_name="URL del logotipo"
    )
    sitio_web = models.URLField(
        max_length=500, blank=True, default="", verbose_name="sitio web"
    )
    activo = models.BooleanField(default=True, verbose_name="activo")
    orden = models.PositiveIntegerField(default=0, verbose_name="orden")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "clientes_client_logo"
        ordering = ["orden", "nombre"]
        indexes = [
            models.Index(fields=["activo", "orden"], name="clientes_lo_activo_8f1b9d_idx"),
        ]

    def __str__(self) -> str:
        estado = "activo" if self.activo else "inactivo"
        return f"{self.nombre} ({estado})"
