"""
User admin DRF views — admin-only user management (HU-14, D25).

HTTP orchestration only (SRP + DIP + ISP). Depend on IUserAdminActions via
get_user_admin_service(); declare IsAdmin.

Endpoints:
    GET   /api/usuarios            → list (filter ?role=, ?estado=)
    POST  /api/usuarios            → create worker/admin
    PATCH /api/usuarios/<id>/bloquear    → block
    PATCH /api/usuarios/<id>/desbloquear → unblock
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers.user_admin_serializers import UserCreateSerializer
from apps.authentication.services.user_admin_service import (
    get_user_admin_service,
    UserNotFound,
)
from core.exceptions.domain_exceptions import DomainException
from core.permissions import IsAdmin


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
        return Response(created, status=status.HTTP_201_CREATED)


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
