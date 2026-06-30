"""
TicketCreateSerializer — validates ticket creation input (SRP).
Field-level checks only; business rules (duplicates, business hours) live in the
validator chain (S13), invoked by TicketService.
"""

from rest_framework import serializers


class TicketCreateSerializer(serializers.Serializer):
    asunto = serializers.CharField(max_length=80)
    descripcion = serializers.CharField(min_length=10)
    servicio_id = serializers.IntegerField()
    prioridad = serializers.ChoiceField(
        choices=["Baja", "Media", "Alta", "Critica"],
        default="Media",
    )
    # adjuntos arrive as multipart files; handled in the view via request.FILES
