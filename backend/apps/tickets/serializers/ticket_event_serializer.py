"""
TicketEventSerializer — read-only serializer for audit log entries.

Responsibility (SRP): transform a TicketEvent instance into a dict for API responses.
    No write operations — TicketEvents are append-only (created by TicketService).
Depends on: DRF ModelSerializer, TicketEvent model.
Pattern: SRP (one serializer per operation — this is the read operation for events).
SOLID: SRP

Fields exposed:
    id, tipo_evento, estado_anterior, estado_nuevo, comentario,
    autor_nombre (historical snapshot), created_at

Not exposed: ticket_id (inferred from context), autor FK raw ID.
"""

from rest_framework import serializers

from apps.tickets.models import TicketEvent


class TicketEventSerializer(serializers.ModelSerializer):

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
