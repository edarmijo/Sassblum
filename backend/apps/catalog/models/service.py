"""
Service model — a catalog service a client can open a ticket against (SRP).

Responsibility (SRP): persist service data only. Business logic (activation rules,
    validation) lives in CatalogService. The model only stores.
Depends on: Django ORM.
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new field = additive, no logic change)
"""

from django.db import models


class Service(models.Model):

    nombre = models.CharField(max_length=120, unique=True, verbose_name="nombre")
    descripcion = models.TextField(verbose_name="descripción")
    categoria = models.CharField(max_length=80, verbose_name="categoría")
    activo = models.BooleanField(default=True, verbose_name="activo")
    imagen_url = models.URLField(
        max_length=500, blank=True, default="", verbose_name="URL de imagen"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "catalog_service"
        ordering = ["categoria", "nombre"]
        indexes = [
            models.Index(fields=["activo", "categoria"]),
        ]

    def __str__(self) -> str:
        estado = "activo" if self.activo else "inactivo"
        return f"{self.nombre} ({self.categoria}) · {estado}"
