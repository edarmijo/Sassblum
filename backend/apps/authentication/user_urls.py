"""User-management routing (HU-14/B13b). Mounted under /api/usuarios/."""

from django.urls import path

from apps.authentication.views.user_admin_views import (
    UserListCreateView,
    UserDetailView,
    UserBlockView,
    UserManualMailboxConfirmView,
    UserManualOccupantRotateView,
    UserMailboxRetryView,
    UserOccupantRotateView,
    UserUnblockView,
)

urlpatterns = [
    path("", UserListCreateView.as_view(), name="user-list-create"),
    path("<int:user_id>", UserDetailView.as_view(), name="user-detail"),
    path("<int:user_id>/bloquear", UserBlockView.as_view(), name="user-block"),
    path("<int:user_id>/desbloquear", UserUnblockView.as_view(), name="user-unblock"),
    path(
        "<int:user_id>/buzon/reintentar",
        UserMailboxRetryView.as_view(),
        name="user-mailbox-retry",
    ),
    path(
        "<int:user_id>/buzon/confirmar-manual",
        UserManualMailboxConfirmView.as_view(),
        name="user-mailbox-confirm-manual",
    ),
    path(
        "<int:user_id>/rotar-ocupante",
        UserOccupantRotateView.as_view(),
        name="user-occupant-rotate",
    ),
    path(
        "<int:user_id>/rotar-ocupante-manual",
        UserManualOccupantRotateView.as_view(),
        name="user-occupant-rotate-manual",
    ),
]
