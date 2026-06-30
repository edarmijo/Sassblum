"""
Ticket history DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ repository calls for the read/history paths.
    No business logic; the ORM lives behind TicketRepository (DIP).
Pattern: Repository (queries) + DIP.
SOLID: SRP · DIP · ISP (role-based ACL inside the repository)

Endpoints:
    GET /api/tickets                 → TicketListView   (filters + pagination, role-scoped)
    GET /api/tickets/<id>/historial  → TicketHistoryView (event timeline)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tickets.repositories import TicketRepository
from apps.tickets.serializers import TicketListSerializer, TicketEventSerializer

_FILTER_KEYS = ("estado", "prioridad", "servicio_id", "fecha_desde", "fecha_hasta")


class TicketListView(APIView):
    """GET /api/tickets — paginated, filtered, role-scoped ticket list."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        repo = TicketRepository()
        page = int(request.query_params.get("page", 1))
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}

        result = repo.get_all_for_user(request.user, filters, page)
        data = TicketListSerializer(result["items"], many=True).data
        return Response(
            {
                "items": data,
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
            },
            status=status.HTTP_200_OK,
        )


class TicketHistoryView(APIView):
    """GET /api/tickets/<id>/historial — event timeline for a ticket."""

    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id: int):
        repo = TicketRepository()
        events = repo.get_history(ticket_id, request.user)
        if events is None:
            return Response(
                {"detail": "Ticket no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        data = TicketEventSerializer(events, many=True).data
        return Response(data, status=status.HTTP_200_OK)
