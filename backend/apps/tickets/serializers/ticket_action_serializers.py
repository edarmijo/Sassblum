"""
Ticket action serializers — one per write operation (SRP).
Used by assignment (admin) and status/comment (worker) endpoints.
"""

from rest_framework import serializers


class AssignSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField()


class StatusChangeSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(
        choices=["Nuevo", "EnProceso", "EnEspera", "Resuelto", "Cerrado"]
    )
    comentario = serializers.CharField(allow_blank=False)


class CommentSerializer(serializers.Serializer):
    comentario = serializers.CharField(allow_blank=False)


class ContactUpdateSerializer(serializers.Serializer):
    nombre = serializers.CharField(
        allow_blank=False,
        max_length=301,
        required=False,
        trim_whitespace=True,
    )
    email = serializers.EmailField(max_length=254, required=False)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate(self, attrs: dict) -> dict:
        if not attrs:
            raise serializers.ValidationError(
                "Debe enviar al menos el nombre o el correo del contacto."
            )
        return attrs
