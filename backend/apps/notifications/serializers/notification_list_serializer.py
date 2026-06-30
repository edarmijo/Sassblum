"""
NotificationListSerializer — read-only serializer for the notification list (SRP).

Responsibility (SRP): shape a Notification for the GET /api/notificaciones response.
    One serializer per operation — this is the read/list operation.
Depends on: DRF ModelSerializer, Notification model.
SOLID: SRP
"""

from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationListSerializer(serializers.ModelSerializer):

    creado_en = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "tipo", "titulo", "cuerpo", "leida", "payload", "creado_en"]
        read_only_fields = fields
