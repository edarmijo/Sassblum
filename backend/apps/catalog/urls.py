"""URL routing for the catalog API. Mounted under /api/servicios/ by config/urls.py."""

from django.urls import path

from apps.catalog.views import ServiceListView, ServiceDetailView, ServiceAdminView

urlpatterns = [
    path("", ServiceListView.as_view(), name="service-list"),
    path("admin/", ServiceAdminView.as_view(), name="service-admin-create"),
    path("admin/<int:service_id>", ServiceAdminView.as_view(), name="service-admin-edit"),
    path("<int:service_id>", ServiceDetailView.as_view(), name="service-detail"),
]
