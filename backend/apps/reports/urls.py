"""Reports routing. Mounted under /api/reportes/ by config/urls.py."""

from django.urls import path

from apps.reports.views import ReportDashboardView, ReportExportView

urlpatterns = [
    path("tickets", ReportDashboardView.as_view(), name="report-dashboard"),
    path("exportar", ReportExportView.as_view(), name="report-export"),
]
