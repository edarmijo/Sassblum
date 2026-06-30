"""
NotificationPreferencesSerializer — for reading/updating channel preferences (SRP).

Responsibility (SRP): validate the PATCH /api/notificaciones/preferencias payload.
    All three fields optional (partial update). One serializer per operation.
Depends on: DRF Serializer.
SOLID: SRP
"""

from rest_framework import serializers


class NotificationPreferencesSerializer(serializers.Serializer):
    email_activo = serializers.BooleanField(required=False)
    in_app_activo = serializers.BooleanField(required=False)
    ws_activo = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "Debe enviar al menos un campo de preferencia para actualizar."
            )
        return attrs
