"""HTTP adapters for public client logos and the admin CRUD (SRP)."""

from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clientes.serializers import ClientLogoCreateSerializer, ClientLogoEditSerializer
from apps.clientes.services import ClientLogoNotFound, get_client_logo_service
from core.http import public_cache
from core.permissions import IsAdmin


class ClientLogoListView(APIView):
    """Public endpoint consumed by the customer-logo carousel."""

    permission_classes = [AllowAny]

    def get(self, request):
        logos = get_client_logo_service().get_active_logos()
        return public_cache(
            Response({"items": logos, "total": len(logos)}, status=status.HTTP_200_OK),
        )


class ClientLogoAdminView(APIView):
    """Authenticated admin CRUD; binary uploads flow through IStorageService."""

    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(get_client_logo_service().list_all(), status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ClientLogoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        logo = request.FILES.get("logo")
        if logo is not None:
            data["logo"] = logo
        if not logo and not data.get("logo_url"):
            return Response(
                {"detail": "Adjunta un archivo 'logo' o proporciona 'logo_url'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            created = get_client_logo_service().create_logo(data)
        except (RuntimeError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(created, status=status.HTTP_201_CREATED)

    def patch(self, request, logo_id: int):
        if request.query_params.get("action") == "toggle":
            return self._toggle(logo_id)
        serializer = ClientLogoEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        logo = request.FILES.get("logo")
        if logo is not None:
            data["logo"] = logo
        try:
            updated = get_client_logo_service().edit_logo(logo_id, data)
        except ClientLogoNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except (RuntimeError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(updated, status=status.HTTP_200_OK)

    def delete(self, request, logo_id: int):
        try:
            get_client_logo_service().delete_logo(logo_id)
        except ClientLogoNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _toggle(self, logo_id: int):
        try:
            updated = get_client_logo_service().toggle_active(logo_id)
        except ClientLogoNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)
