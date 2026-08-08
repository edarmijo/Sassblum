"""
Catalog DRF views — HTTP orchestration only (SRP + DIP + ISP).

Browse views depend on ICatalogClientView; admin views on ICatalogAdminView
(both resolved from the same Singleton via get_catalog_service()). The view never
touches the ORM. Service management (create/edit/toggle) requires worker or admin.

Endpoints:
    GET    /api/servicios                              → ServiceListView   (public)
    GET    /api/servicios/<id>                         → ServiceDetailView (authenticated)
    POST   /api/servicios/admin                        → ServiceAdminView.post   (IsAdmin)
    PATCH  /api/servicios/admin/<id>                   → ServiceAdminView.patch  (IsAdmin)
    PATCH  /api/servicios/admin/<id>?action=toggle     → toggle           (IsAdmin)
    POST   /api/servicios/admin/<id>/imagenes/         → ServiceImageAdminView.post   (IsAdmin)
    DELETE /api/servicios/admin/imagenes/<img_id>/     → ServiceImageAdminView.delete (IsAdmin)

Service photos: the admin endpoints accept a multipart `imagen` file which is
uploaded to Supabase Storage by CatalogService via IStorageService (DIP).
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.serializers import ServiceCreateSerializer, ServiceEditSerializer
from apps.catalog.services import get_catalog_service
from core.exceptions.domain_exceptions import ServiceNotFound
from core.permissions import IsAdmin


class ServiceListView(APIView):
    # Public marketing catalog (homepage / public "Servicios" page).
    permission_classes = [AllowAny]

    def get(self, request):
        filters = {
            k: request.query_params[k]
            for k in ("categoria", "busqueda")
            if k in request.query_params
        }
        services = get_catalog_service().get_active_services(filters)
        return Response(
            {"items": services, "total": len(services)},
            status=status.HTTP_200_OK,
        )


class ServiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, service_id: int):
        try:
            detail = get_catalog_service().get_service_detail(service_id)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(detail, status=status.HTTP_200_OK)


class ServiceAdminView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        services = [get_catalog_service()._detail(s) for s in get_catalog_service()._repo.get_all()]
        return Response(services, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ServiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        created = get_catalog_service().create_service(data)
        return Response(created, status=status.HTTP_201_CREATED)

    def patch(self, request, service_id: int):
        # toggle path is handled by a distinct URL → action query flag
        if request.query_params.get("action") == "toggle":
            return self._toggle(service_id)
        serializer = ServiceEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        try:
            updated = get_catalog_service().edit_service(service_id, data)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

    def _toggle(self, service_id: int):
        try:
            updated = get_catalog_service().toggle_active(service_id)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)


class ServiceImageAdminView(APIView):
    """
    Gallery image management for a catalog service (IsAdmin only).

    POST   /api/servicios/admin/<service_id>/imagenes/   — upload a gallery image
    DELETE /api/servicios/admin/imagenes/<image_id>/     — remove a gallery image
    """

    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, service_id: int):
        imagen = request.FILES.get("imagen")
        if not imagen:
            return Response(
                {"detail": "Se requiere un archivo de imagen."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            result = get_catalog_service().add_service_image(service_id, imagen)
        except ServiceNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:  # noqa: BLE001
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)

    def delete(self, request, image_id: int):
        get_catalog_service().delete_service_image(image_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
