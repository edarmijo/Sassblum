"""
Ticket action DRF views — assignment (admin) + status/comment (worker).

HTTP orchestration only (SRP + DIP + ISP). Each view depends on the role interface
of TicketService (via get_ticket_service()) and declares only its RBAC permission.

Endpoints:
    PATCH /api/tickets/<id>/asignar     → AssignView      (IsAdmin)
    PATCH /api/tickets/<id>/reasignar   → ReassignView    (IsAdmin)
    PATCH /api/tickets/<id>/estado      → UpdateStatusView (IsWorker)
    POST  /api/tickets/<id>/comentario  → AddCommentView  (authenticated party)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tickets.serializers.ticket_action_serializers import (
    AssignSerializer,
    StatusChangeSerializer,
    CommentSerializer,
)
from apps.tickets.services import get_ticket_service
from apps.tickets.services.ticket_service import TicketValidationError
from core.exceptions.domain_exceptions import (
    TicketNotFound,
    InvalidTransitionError,
    CommentRequiredError,
)
from core.permissions import IsAdmin, IsWorker


def _handle_domain_errors(fn):
    """Map domain exceptions to HTTP responses (shared by the action views)."""
    try:
        return Response(fn(), status=status.HTTP_200_OK)
    except TicketNotFound as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except CommentRequiredError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except InvalidTransitionError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except TicketValidationError as exc:
        return Response(
            {"detail": str(exc), "field": exc.field},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AssignView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, ticket_id: int):
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        worker_id = serializer.validated_data["worker_id"]
        return _handle_domain_errors(
            lambda: svc.assign_ticket(ticket_id, worker_id, request.user)
        )


class ReassignView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, ticket_id: int):
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        worker_id = serializer.validated_data["worker_id"]
        return _handle_domain_errors(
            lambda: svc.reassign_ticket(ticket_id, worker_id, request.user)
        )


class UpdateStatusView(APIView):
    permission_classes = [IsWorker]

    def patch(self, request, ticket_id: int):
        serializer = StatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        svc = get_ticket_service()
        return _handle_domain_errors(
            lambda: svc.update_status(ticket_id, data["estado"], data["comentario"], request.user)
        )


class AddCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id: int):
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        svc = get_ticket_service()
        comentario = serializer.validated_data["comentario"]
        return _handle_domain_errors(
            lambda: svc.add_comment(ticket_id, comentario, request.user)
        )
