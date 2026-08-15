"""Validation contracts for testimonial client and moderation commands."""

from __future__ import annotations

from rest_framework import serializers

from apps.testimonials.models import Testimonial


class TestimonialInputSerializer(serializers.Serializer):
    calificacion = serializers.IntegerField(min_value=1, max_value=5)
    comentario = serializers.CharField(min_length=20, max_length=500, trim_whitespace=True)


class TestimonialModerationSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(
        choices=(Testimonial.Status.APPROVED, Testimonial.Status.REJECTED),
    )
    nota_moderacion = serializers.CharField(
        max_length=300,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    def validate(self, attrs: dict) -> dict:
        if attrs["estado"] == Testimonial.Status.REJECTED and not attrs.get("nota_moderacion"):
            raise serializers.ValidationError(
                {"nota_moderacion": "Explica brevemente qué debe corregir el cliente."}
            )
        return attrs
