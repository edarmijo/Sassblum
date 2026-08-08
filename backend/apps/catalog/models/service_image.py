"""
ServiceImage — gallery image attached to a catalog Service (SRP).

Responsibility (SRP): persist image URLs and display order. Business logic
    (upload, deletion, ordering) lives in CatalogService / ServiceRepository.
Depends on: Django ORM, catalog.Service (FK).
Pattern: Domain Model (data-only).
SOLID: SRP · OCP (new field = additive, no logic change)
"""

from django.db import models


class ServiceImage(models.Model):

    servicio = models.ForeignKey(
        'catalog.Service',
        on_delete=models.CASCADE,
        related_name='imagenes',
        verbose_name='servicio',
    )
    imagen_url = models.URLField(max_length=500, verbose_name='URL de imagen')
    orden = models.PositiveSmallIntegerField(default=0, verbose_name='orden')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "catalog_service_image"
        ordering = ['servicio', 'orden']
        indexes = [models.Index(fields=['servicio', 'orden'])]

    def __str__(self):
        return f"Imagen {self.orden} de {self.servicio_id}"
