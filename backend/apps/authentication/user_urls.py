"""User-management routing (HU-14). Mounted under /api/usuarios/ by config/urls.py."""

from django.urls import path

from apps.authentication.views.user_admin_views import (
    UserListCreateView,
    UserBlockView,
    UserUnblockView,
)

urlpatterns = [
    path("", UserListCreateView.as_view(), name="user-list-create"),
    path("<int:user_id>/bloquear", UserBlockView.as_view(), name="user-block"),
    path("<int:user_id>/desbloquear", UserUnblockView.as_view(), name="user-unblock"),
]
