"""
Gallery DRF views — HTTP orchestration only (SRP + DIP).

Endpoints (mounted under /api/proyectos/ by config/urls.py):
    GET   /api/proyectos              → ProjectListView   (public — portfolio)
    GET   /api/proyectos/admin        → ProjectAdminView.get   (IsAdmin) — list all
    POST  /api/proyectos/admin        → ProjectAdminView.post  (IsAdmin) — create
    PATCH /api/proyectos/admin/<id>   → ProjectAdminView.patch (IsAdmin) — edit
    PATCH /api/proyectos/admin/<id>?action=toggle → toggle     (IsAdmin)

Photos: the admin endpoints accept a multipart `imagen` file uploaded via
IStorageService, mirroring the catalog.
"""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gallery.serializers import ProjectCreateSerializer, ProjectEditSerializer
from apps.gallery.services import get_gallery_service
from apps.gallery.services.gallery_service import ProjectNotFound
from core.http import public_cache
from core.permissions import IsAdmin


class ProjectListView(APIView):
    # Public portfolio (gallery page).
    permission_classes = [AllowAny]

    def get(self, request):
        projects = get_gallery_service().get_active_projects()
        return public_cache(Response(
            {"items": projects, "total": len(projects)},
            status=status.HTTP_200_OK,
        ))


class ProjectAdminView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(get_gallery_service().list_all(), status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        created = get_gallery_service().create_project(data)
        return Response(created, status=status.HTTP_201_CREATED)

    def patch(self, request, project_id: int):
        if request.query_params.get("action") == "toggle":
            return self._toggle(project_id)
        serializer = ProjectEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        imagen = request.FILES.get("imagen")
        if imagen is not None:
            data["imagen"] = imagen
        try:
            updated = get_gallery_service().edit_project(project_id, data)
        except ProjectNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)

    def delete(self, request, project_id: int):
        try:
            get_gallery_service().delete_project(project_id)
        except ProjectNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _toggle(self, project_id: int):
        try:
            updated = get_gallery_service().toggle_active(project_id)
        except ProjectNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated, status=status.HTTP_200_OK)
