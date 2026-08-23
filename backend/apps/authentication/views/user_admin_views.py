"""
User admin DRF views — admin-only user management (HU-14, D25).

HTTP orchestration only (SRP + DIP + ISP). Depend on IUserAdminActions via
get_user_admin_service(); declare IsAdmin.

Endpoints:
    GET   /api/usuarios            → list (filter ?role=, ?estado=)
    POST  /api/usuarios            → create worker/admin
    PATCH /api/usuarios/<id>       → update first/last name only
    PATCH /api/usuarios/<id>/bloquear    → block
    PATCH /api/usuarios/<id>/desbloquear → unblock
    POST  /api/usuarios/<id>/buzon/reintentar → idempotent mailbox retry
    POST  /api/usuarios/<id>/buzon/confirmar-manual → admin attestation
    POST  /api/usuarios/<id>/rotar-ocupante → rotate app + mailbox credentials
    POST  /api/usuarios/<id>/rotar-ocupante-manual → rotate app after cPanel
"""

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers.user_admin_serializers import (
    UserManualMailboxConfirmSerializer,
    UserManualOccupantRotateSerializer,
    UserCreateSerializer,
    UserOccupantRotateSerializer,
    UserUpdateSerializer,
)
from apps.authentication.services.user_admin_service import (
    MailboxOperationFailed,
    get_user_admin_service,
    UserNotFound,
)
from core.exceptions.domain_exceptions import DomainException
from core.permissions import IsAdmin


def _user_response(data: dict, response_status: int) -> Response:
    """Evita que respuestas con credenciales efímeras se almacenen en caché."""
    response = Response(data, status=response_status)
    if "app_password" in data or "buzon_password" in data:
        response["Cache-Control"] = "no-store"
        response["Pragma"] = "no-cache"
    return response


class UserListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        filters = {}
        if "role" in request.query_params:
            filters["role"] = request.query_params["role"]
        if "estado" in request.query_params:
            filters["estado"] = request.query_params["estado"]
        users = get_user_admin_service().list_users(filters)
        return Response({"items": users, "total": len(users)}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            created = get_user_admin_service().create_user(serializer.validated_data)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return _user_response(created, status.HTTP_201_CREATED)


class UserDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request: Request, user_id: int) -> Response:
        serializer = UserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = get_user_admin_service().update_user(
                user_id,
                serializer.validated_data,
            )
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)


class UserBlockView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id: int):
        try:
            updated = get_user_admin_service().block_user(user_id)
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)


class UserUnblockView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id: int):
        try:
            updated = get_user_admin_service().unblock_user(user_id)
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)


class UserMailboxRetryView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request: Request, user_id: int) -> Response:
        try:
            updated = get_user_admin_service().retry_mailbox(user_id)
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return _user_response(updated, status.HTTP_200_OK)


class UserManualMailboxConfirmView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request: Request, user_id: int) -> Response:
        serializer = UserManualMailboxConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = get_user_admin_service().confirm_manual_mailbox(
                user_id,
                serializer.validated_data["email"],
                request.user,
            )
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(updated, status=status.HTTP_200_OK)


class UserOccupantRotateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request: Request, user_id: int) -> Response:
        serializer = UserOccupantRotateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = get_user_admin_service().rotate_occupant(
                user_id,
                serializer.validated_data,
                request.user,
            )
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except MailboxOperationFailed as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return _user_response(updated, status.HTTP_200_OK)


class UserManualOccupantRotateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request: Request, user_id: int) -> Response:
        serializer = UserManualOccupantRotateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = get_user_admin_service().rotate_occupant_manually(
                user_id,
                serializer.validated_data,
                request.user,
            )
        except UserNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return _user_response(updated, status.HTTP_200_OK)
