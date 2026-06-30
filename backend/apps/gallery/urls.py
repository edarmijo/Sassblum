"""URL routing for the gallery API. Mounted under /api/proyectos/ by config/urls.py."""

from django.urls import path

from apps.gallery.views import ProjectListView, ProjectAdminView

urlpatterns = [
    path("", ProjectListView.as_view(), name="project-list"),
    path("admin/", ProjectAdminView.as_view(), name="project-admin-create"),
    path("admin/<int:project_id>", ProjectAdminView.as_view(), name="project-admin-edit"),
]
