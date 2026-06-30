"""
Project model — a portfolio/gallery item the admin manages (SRP).

Mirrors the catalog Service pattern: the model only stores data; business logic
lives in GalleryService. Lets the admin add gallery cards without touching code.
SOLID: SRP · OCP (new field = additive).
"""

from django.db import models


class Project(models.Model):

    titulo = models.CharField(max_length=120, verbose_name="título")
    descripcion = models.TextField(blank=True, default="", verbose_name="descripción")
    tag = models.CharField(max_length=80, blank=True, default="", verbose_name="etiqueta")
    imagen_url = models.URLField(
        max_length=500, blank=True, default="", verbose_name="URL de imagen"
    )
    activo = models.BooleanField(default=True, verbose_name="activo")
    orden = models.PositiveIntegerField(default=0, verbose_name="orden")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "gallery_project"
        ordering = ["orden", "-created_at"]
        indexes = [
            models.Index(fields=["activo", "orden"], name="gallery_pro_activo_idx"),
        ]

    def __str__(self) -> str:
        estado = "activo" if self.activo else "inactivo"
        return f"{self.titulo} ({self.tag}) · {estado}"
