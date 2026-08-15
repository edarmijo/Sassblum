"""Persistent customer testimonial; business rules live in the service layer."""

from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Testimonial(models.Model):
    """One moderated testimonial per customer account."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        APPROVED = "approved", "Aprobado"
        REJECTED = "rejected", "Rechazado"

    cliente = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="testimonial",
        verbose_name="cliente",
    )
    calificacion = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="calificación",
    )
    comentario = models.CharField(max_length=500, verbose_name="comentario")
    estado = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="estado",
    )
    nota_moderacion = models.CharField(
        max_length=300,
        blank=True,
        default="",
        verbose_name="nota de moderación",
    )
    moderado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="testimonials_moderated",
        verbose_name="moderado por",
    )
    moderado_en = models.DateTimeField(null=True, blank=True, verbose_name="moderado en")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado en")

    class Meta:
        db_table = "testimonials_testimonial"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["estado", "-moderado_en"], name="testimonial_public_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(calificacion__gte=1, calificacion__lte=5),
                name="testimonial_rating_between_1_and_5",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.cliente.email}: {self.calificacion}/5 ({self.estado})"
