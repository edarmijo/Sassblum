"""Integration tests for public and IsAdmin client-logo endpoints."""

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.clientes.models import ClientLogo


@pytest.mark.django_db
class TestClientLogoApi:
    def _admin_client(self) -> APIClient:
        admin = User.objects.create_user(
            email="logos-admin@test.com",
            role=User.Role.ADMIN,
            estado=User.Estado.ACTIVE,
            email_verificado=True,
        )
        client = APIClient()
        client.force_authenticate(user=admin)
        return client

    def test_public_endpoint_lists_only_active_logos(self):
        ClientLogo.objects.create(nombre="SOELEC", logo_url="https://cdn.example/soelec.png", orden=2)
        ClientLogo.objects.create(nombre="Oculto", logo_url="https://cdn.example/hidden.png", activo=False)

        response = APIClient().get("/api/clientes/")

        assert response.status_code == 200
        assert response.data["total"] == 1
        assert response.data["items"][0]["nombre"] == "SOELEC"
        assert "activo" not in response.data["items"][0]

    def test_admin_crud_uses_is_admin_and_can_toggle_and_delete(self):
        anonymous = APIClient().post(
            "/api/clientes/admin/",
            {"nombre": "SOELEC", "logo_url": "https://cdn.example/soelec.png"},
            format="json",
        )
        assert anonymous.status_code == 401

        client = self._admin_client()
        created = client.post(
            "/api/clientes/admin/",
            {"nombre": "SOELEC", "logo_url": "https://cdn.example/soelec.png"},
            format="json",
        )
        assert created.status_code == 201
        logo_id = created.data["id"]

        toggled = client.patch(f"/api/clientes/admin/{logo_id}/?action=toggle", format="json")
        assert toggled.status_code == 200
        assert toggled.data["activo"] is False

        deleted = client.delete(f"/api/clientes/admin/{logo_id}/")
        assert deleted.status_code == 204
        assert not ClientLogo.objects.filter(pk=logo_id).exists()

    def test_create_rejects_logo_without_upload_or_url(self):
        response = self._admin_client().post(
            "/api/clientes/admin/", {"nombre": "Sin logo"}, format="json"
        )

        assert response.status_code == 400
        assert "logo" in response.data["detail"]
