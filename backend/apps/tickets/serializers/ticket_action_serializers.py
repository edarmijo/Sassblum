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
