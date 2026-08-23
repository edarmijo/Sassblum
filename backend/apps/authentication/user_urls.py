"""User-management routing (HU-14/B13b). Mounted under /api/usuarios/."""

from django.urls import path

from apps.authentication.views.user_admin_views import (
    UserListCreateView,
    UserDetailView,
    UserBlockView,
    UserUnblockView,
)

urlpatterns = [
    path("", UserListCreateView.as_view(), name="user-list-create"),
    path("<int:user_id>", UserDetailView.as_view(), name="user-detail"),
    path("<int:user_id>/bloquear", UserBlockView.as_view(), name="user-block"),
    path("<int:user_id>/desbloquear", UserUnblockView.as_view(), name="user-unblock"),
]
