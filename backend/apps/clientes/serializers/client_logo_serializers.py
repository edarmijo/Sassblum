"""Input validation for customer-logo write operations (SRP)."""

from rest_framework import serializers


class ClientLogoCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120)
    logo_url = serializers.URLField(max_length=500, required=False, allow_blank=True, default="")
    sitio_web = serializers.URLField(max_length=500, required=False, allow_blank=True, default="")
    activo = serializers.BooleanField(required=False, default=True)
    orden = serializers.IntegerField(required=False, min_value=0, default=0)


class ClientLogoEditSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120, required=False)
    logo_url = serializers.URLField(max_length=500, required=False, allow_blank=True)
    sitio_web = serializers.URLField(max_length=500, required=False, allow_blank=True)
    activo = serializers.BooleanField(required=False)
    orden = serializers.IntegerField(required=False, min_value=0)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Envía al menos un campo para actualizar.")
        return attrs
