"""Routes mounted at /api/clientes/ by config.urls."""

from django.urls import path

from apps.clientes.views import ClientLogoAdminView, ClientLogoListView

urlpatterns = [
    path("", ClientLogoListView.as_view(), name="client-logo-list"),
    path("admin/", ClientLogoAdminView.as_view(), name="client-logo-admin-create"),
    path("admin/<int:logo_id>/", ClientLogoAdminView.as_view(), name="client-logo-admin-detail"),
]
