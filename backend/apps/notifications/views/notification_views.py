"""
Notification DRF views — HTTP orchestration only (SRP + DIP).

Responsibility (SRP): translate HTTP ↔ service calls. No ORM, no business logic.
Depends on: INotificationService (via get_notification_service) — DIP.
    The view never touches the ORM or the repository directly.
Pattern: DIP (view → service interface).
SOLID: SRP · DIP

Endpoints:
    GET   /api/notificaciones                      → NotificationListView
    PATCH /api/notificaciones/<id>/marcar-leida    → MarkReadView
    PATCH /api/notificaciones/marcar-todas-leidas  → MarkAllReadView
    GET   /api/notificaciones/preferencias         → NotificationPreferencesView (read)
    PATCH /api/notificaciones/preferencias         → NotificationPreferencesView (update)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.serializers import NotificationPreferencesSerializer
from apps.notifications.services import get_notification_service
from core.exceptions.domain_exceptions import DomainException


class NotificationListView(APIView):
    """GET /api/notificaciones — paginated notifications for the current user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.query_params.get("page", 1))
        service = get_notification_service()
        data = service.get_user_notifications(request.user, page)
        return Response(data, status=status.HTTP_200_OK)


class MarkReadView(APIView):
    """PATCH /api/notificaciones/<id>/marcar-leida — mark one as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id: int):
        service = get_notification_service()
        try:
            notif = service.mark_as_read(notification_id, request.user)
        except DomainException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(notif, status=status.HTTP_200_OK)


class MarkAllReadView(APIView):
    """PATCH /api/notificaciones/marcar-todas-leidas — mark every unread as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        service = get_notification_service()
        affected = service.mark_all_as_read(request.user)
        return Response({"marcadas": affected}, status=status.HTTP_200_OK)


class NotificationPreferencesView(APIView):
    """GET/PATCH /api/notificaciones/preferencias — channel preferences."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = get_notification_service()
        return Response(service.get_preferences(request.user), status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = NotificationPreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = get_notification_service()
        updated = service.set_preferences(request.user, serializer.validated_data)
        return Response(updated, status=status.HTTP_200_OK)
