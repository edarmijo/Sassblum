"""
Gallery write serializers — one per operation (SRP).
Read shaping is done by GalleryService (_summary/_detail).
"""

from rest_framework import serializers


class ProjectCreateSerializer(serializers.Serializer):
    titulo = serializers.CharField(max_length=120)
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")
    tag = serializers.CharField(max_length=80, required=False, allow_blank=True, default="")
    imagen_url = serializers.URLField(max_length=500, required=False, allow_blank=True, default="")
    orden = serializers.IntegerField(required=False, default=0)


class ProjectEditSerializer(serializers.Serializer):
    titulo = serializers.CharField(max_length=120, required=False)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    tag = serializers.CharField(max_length=80, required=False, allow_blank=True)
    imagen_url = serializers.URLField(max_length=500, required=False, allow_blank=True)
    orden = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Envía al menos un campo para actualizar.")
        return attrs
