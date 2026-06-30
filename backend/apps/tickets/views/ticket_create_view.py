"""
Ticket creation + detail DRF views — HTTP orchestration only (SRP + DIP + ISP).

CreateTicketView depends on ITicketClientActions (via get_ticket_service()), declares
IsClient. The view never touches the ORM or business rules.

Endpoints:
    POST /api/tickets        → CreateTicketView (IsClient)
    GET  /api/tickets/<id>   → TicketDetailView (authenticated, ownership enforced)
"""

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.services import get_catalog_service
from apps.tickets.repositories import TicketRepository
from apps.tickets.serializers import TicketListSerializer
from apps.tickets.serializers.ticket_create_serializer import TicketCreateSerializer
from apps.tickets.services import get_ticket_service
from apps.tickets.services.ticket_service import TicketValidationError
from core.exceptions.domain_exceptions import ServiceNotFound, TicketNotFound
from core.permissions import IsClient

_FILTER_KEYS = ("estado", "prioridad", "servicio_id", "fecha_desde", "fecha_hasta", "cliente_id", "asignado_id")


class CreateTicketView(APIView):
    """Collection endpoint: GET lists the caller's tickets, POST creates one (IsClient)."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        # GET = any authenticated role (list); POST = clients only.
        from rest_framework.permissions import IsAuthenticated  # noqa: PLC0415
        return [IsClient()] if self.request.method == "POST" else [IsAuthenticated()]

    def get(self, request):
        repo = TicketRepository()
        page = int(request.query_params.get("page", 1))
        filters = {k: request.query_params[k] for k in _FILTER_KEYS if k in request.query_params}
        result = repo.get_all_for_user(request.user, filters, page)
        return Response(
            {
                "items": TicketListSerializer(result["items"], many=True).data,
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = TicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        # Validate the referenced service exists and is active
        try:
            get_catalog_service().get_service_detail(data["servicio_id"])
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data["adjuntos"] = request.FILES.getlist("adjuntos")
        try:
            ticket = get_ticket_service().create_ticket(data, request.user)
        except TicketValidationError as exc:
            return Response(
                {"detail": str(exc), "field": exc.field},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(ticket, status=status.HTTP_201_CREATED)


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id: int):
        try:
            ticket = get_ticket_service().get_ticket_detail(ticket_id, request.user)
        except TicketNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(ticket, status=status.HTTP_200_OK)
