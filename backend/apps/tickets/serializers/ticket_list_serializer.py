"""
TicketListSerializer — read-only serializer for the ticket history list (SRP).

Responsibility (SRP): shape a Ticket summary for GET /api/tickets.
    One serializer per operation — this is the list/history read.
Depends on: DRF ModelSerializer, Ticket model.
SOLID: SRP
"""

from rest_framework import serializers

from apps.tickets.models import Ticket


class TicketListSerializer(serializers.ModelSerializer):

    servicio_nombre = serializers.CharField(source="servicio.nombre", read_only=True)
    creado_en = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "numero",
            "asunto",
            "estado",
            "prioridad",
            "servicio_nombre",
            "creado_en",
        ]
        read_only_fields = fields
