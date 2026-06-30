"""
URL routing for the notifications API (HU-13).
Mounted under /api/notificaciones/ by config/urls.py.
"""

from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    MarkReadView,
    MarkAllReadView,
    NotificationPreferencesView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("preferencias", NotificationPreferencesView.as_view(), name="notification-preferences"),
    path("marcar-todas-leidas", MarkAllReadView.as_view(), name="notification-mark-all-read"),
    path(
        "<int:notification_id>/marcar-leida",
        MarkReadView.as_view(),
        name="notification-mark-read",
    ),
]
