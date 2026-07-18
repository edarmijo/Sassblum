"""
Profile DRF views — HTTP orchestration only (SRP + DIP).

    GET   /api/auth/perfil  → datos del usuario autenticado
    PATCH /api/auth/perfil  → actualiza nombre/apellido/ruc/empresa propios

La vista depende de IAuthService vía get_auth_service() (DIP). Cualquier usuario
autenticado edita SOLO su propio perfil — nunca el de otros (no recibe id).
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers import ProfileUpdateSerializer
from apps.authentication.services import get_auth_service


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_auth_service().get_profile(request.user), status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = get_auth_service().update_profile(request.user, serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)
