"""Database tests for safe catalog-service deletion."""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.catalog.models import Service, ServiceImage
from apps.catalog.services.catalog_service import CatalogService
from core.exceptions.domain_exceptions import ServiceHasTickets
from apps.tickets.models import Ticket


pytestmark = pytest.mark.django_db


class _StorageSpy:
    def __init__(self) -> None:
        self.deleted_paths: list[str] = []

    def delete(self, path: str) -> None:
        self.deleted_paths.append(path)


def _admin_client() -> APIClient:
    admin = User.objects.create_user(
        email="catalog-delete-admin@test.com",
        role=User.Role.ADMIN,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


def test_delete_service_removes_its_rows_and_only_its_storage_objects() -> None:
    service = Service.objects.create(
        nombre="Servicio a eliminar",
        descripcion="Descripción",
        categoria="Infraestructura",
    )
    service.imagen_url = (
        "https://project.supabase.co/storage/v1/object/public/"
        f"SassBlumImagenes/services/{service.id}/cover/portada.jpg"
    )
    service.save(update_fields=["imagen_url"])
    ServiceImage.objects.create(
        servicio=service,
        orden=0,
        imagen_url=(
            "https://project.supabase.co/storage/v1/object/public/"
            f"SassBlumImagenes/services/{service.id}/gallery/foto.jpg"
        ),
    )
    ServiceImage.objects.create(
        servicio=service,
        orden=1,
        imagen_url="https://cdn.example/external-image.jpg",
    )
    storage = _StorageSpy()

    CatalogService(storage=storage).delete_service(service.id)

    assert not Service.objects.filter(pk=service.id).exists()
    assert not ServiceImage.objects.filter(servicio_id=service.id).exists()
    assert storage.deleted_paths == [
        f"services/{service.id}/cover/portada.jpg",
        f"services/{service.id}/gallery/foto.jpg",
    ]


def test_delete_service_rejects_storage_path_owned_by_another_service() -> None:
    service = Service.objects.create(
        nombre="Servicio aislado",
        descripcion="Descripción",
        categoria="Infraestructura",
    )
    service.imagen_url = (
        "https://project.supabase.co/storage/v1/object/public/"
        f"SassBlumImagenes/services/{service.id + 1}/cover/otra.jpg"
    )
    service.save(update_fields=["imagen_url"])
    storage = _StorageSpy()

    CatalogService(storage=storage).delete_service(service.id)

    assert storage.deleted_paths == []


def test_admin_delete_service_returns_204_and_404() -> None:
    service = Service.objects.create(
        nombre="Servicio por API",
        descripcion="Descripción",
        categoria="Infraestructura",
    )
    client = _admin_client()

    deleted = client.delete(f"/api/servicios/admin/{service.id}/")
    missing = client.delete(f"/api/servicios/admin/{service.id}/")

    assert deleted.status_code == 204
    assert missing.status_code == 404


def test_delete_service_with_tickets_is_rejected_without_deleting_media() -> None:
    service = Service.objects.create(
        nombre="Servicio con historial",
        descripcion="DescripciÃ³n",
        categoria="Infraestructura",
    )
    client_user = User.objects.create_user(
        email="catalog-delete-client@test.com",
        role=User.Role.CLIENT,
        estado=User.Estado.ACTIVE,
        email_verificado=True,
    )
    Ticket.objects.create(
        numero="T-2026-9999",
        asunto="Servicio con historial",
        descripcion="Mantener la referencia histÃ³rica.",
        servicio=service,
        cliente=client_user,
    )
    storage = _StorageSpy()

    with pytest.raises(ServiceHasTickets):
        CatalogService(storage=storage).delete_service(service.id)

    assert Service.objects.filter(pk=service.id).exists()
    assert storage.deleted_paths == []
