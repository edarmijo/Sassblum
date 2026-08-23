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
    # H#6 (admin): datos del cliente para filtrado y visualización
    cliente_email = serializers.EmailField(source="cliente.email", read_only=True, default="")
    cliente_empresa = serializers.CharField(source="cliente.empresa", read_only=True, default="")
    cliente_ruc = serializers.CharField(source="cliente.ruc", read_only=True, default="")
    # Datos del trabajador asignado
    asignado_nombre = serializers.SerializerMethodField(read_only=True)
    asignado_email = serializers.EmailField(source="asignado.email", read_only=True, default="")

    def get_asignado_nombre(self, obj: Ticket) -> str:
        if not obj.asignado_id:
            return ""
        first = obj.asignado.first_name or ""
        last = obj.asignado.last_name or ""
        return f"{first} {last}".strip() or obj.asignado.email

    class Meta:
        model = Ticket
        fields = [
            "id",
            "numero",
            "asunto",
            "estado",
            "prioridad",
            "servicio_nombre",
            "cliente_email",
            "cliente_empresa",
            "cliente_ruc",
            "asignado_nombre",
            "asignado_email",
            "creado_en",
        ]
        read_only_fields = fields

