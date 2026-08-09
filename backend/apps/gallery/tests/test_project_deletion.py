"""Database tests for safe gallery-project deletion."""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.gallery.models import Project
from apps.gallery.services.gallery_service import GalleryService


pytestmark = pytest.mark.django_db


class _StorageSpy:
    def __init__(self) -> None:
        self.deleted_paths: list[str] = []

    def delete(self, path: str) -> None:
        self.deleted_paths.append(path)


def _admin_client() -> APIClient:
    admin = User.objects.create_user(
        email="gallery-delete-admin@test.com",
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


def test_delete_project_removes_only_its_own_storage_object() -> None:
    project = Project.objects.create(
        titulo="Proyecto a eliminar",
    )
    project.imagen_url = (
        "https://project.supabase.co/storage/v1/object/public/"
        f"SassBlumImagenes/gallery/{project.id}/portada.jpg"
    )
    project.save(update_fields=["imagen_url"])
    storage = _StorageSpy()

    GalleryService(storage=storage).delete_project(project.id)

    assert not Project.objects.filter(pk=project.id).exists()
    assert storage.deleted_paths == [f"gallery/{project.id}/portada.jpg"]


def test_delete_project_rejects_another_project_storage_path() -> None:
    project = Project.objects.create(
        titulo="Proyecto aislado",
    )
    project.imagen_url = (
        "https://project.supabase.co/storage/v1/object/public/"
        f"SassBlumImagenes/gallery/{project.id + 1}/portada.jpg"
    )
    project.save(update_fields=["imagen_url"])
    storage = _StorageSpy()

    GalleryService(storage=storage).delete_project(project.id)

    assert storage.deleted_paths == []


def test_admin_delete_project_returns_204_and_404() -> None:
    project = Project.objects.create(titulo="Proyecto por API")
    client = _admin_client()

    deleted = client.delete(f"/api/proyectos/admin/{project.id}")
    missing = client.delete(f"/api/proyectos/admin/{project.id}")

    assert deleted.status_code == 204
    assert missing.status_code == 404
