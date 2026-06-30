"""
Catalog write serializers — one per operation (SRP).
Read shaping is done by CatalogService (_summary/_detail), so list/detail
serializers are not needed here; these validate admin write operations.
"""

from rest_framework import serializers


class ServiceCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120)
    descripcion = serializers.CharField()
    categoria = serializers.CharField(max_length=80)
    imagen_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)


class ServiceEditSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120, required=False)
    descripcion = serializers.CharField(required=False)
    categoria = serializers.CharField(max_length=80, required=False)
    imagen_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Envía al menos un campo para actualizar.")
        return attrs
