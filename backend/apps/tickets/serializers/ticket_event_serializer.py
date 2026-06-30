"""
TicketEventSerializer — read-only serializer for audit log entries.

Responsibility (SRP): transform a TicketEvent instance into a dict for API responses.
    No write operations — TicketEvents are append-only (created by TicketService).
Depends on: DRF ModelSerializer, TicketEvent model.
Pattern: SRP (one serializer per operation — this is the read operation for events).
SOLID: SRP

Fields exposed:
    id, tipo_evento, estado_anterior, estado_nuevo, comentario,
    autor_nombre (derived), created_at

Not exposed: ticket_id (inferred from context), autor FK raw ID.
"""

from rest_framework import serializers

from apps.tickets.models import TicketEvent


class TicketEventSerializer(serializers.ModelSerializer):

    autor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = TicketEvent
        fields = [
            "id",
            "tipo_evento",
            "estado_anterior",
            "estado_nuevo",
            "comentario",
            "autor_nombre",
            "created_at",
        ]
        read_only_fields = fields

    def get_autor_nombre(self, obj: TicketEvent) -> str:
        """Return 'nombre apellido' of the event author."""
        return f"{obj.autor.first_name} {obj.autor.last_name}".strip() or obj.autor.email
