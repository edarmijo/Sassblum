"""Unit tests for client-logo service behaviour; no database required."""

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from apps.clientes.services.client_logo_service import ClientLogoService


def _logo(**overrides):
    values = {
        "id": 8,
        "nombre": "SOELEC",
        "logo_url": "https://cdn.example/clients/8/soelec.png",
        "sitio_web": "https://soelec.example",
        "activo": True,
        "orden": 2,
        "created_at": datetime(2026, 8, 8, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 8, 8, tzinfo=timezone.utc),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_summary_returns_only_public_carousel_fields():
    result = ClientLogoService._summary(_logo())

    assert result == {
        "id": 8,
        "nombre": "SOELEC",
        "logo_url": "https://cdn.example/clients/8/soelec.png",
        "sitio_web": "https://soelec.example",
        "orden": 2,
    }


def test_create_uploads_to_a_stable_client_folder():
    uploaded = SimpleNamespace(name="Soélec (final).PNG")
    stored = _logo(logo_url="")
    saved = _logo(logo_url="https://cdn.example/clients/8/Soelec-final.png")

    class Repository:
        def create(self, data):
            assert data == {"nombre": "SOELEC"}
            return stored

        def update(self, logo_id, data):
            assert (logo_id, data) == (8, {"logo_url": saved.logo_url})
            return saved

    class Storage:
        def upload(self, file, path):
            assert file is uploaded
            assert path == "clients/8/Soelec-final.png"
            return saved.logo_url

    service = ClientLogoService(repository=Repository(), storage=Storage())
    result = service.create_logo({"nombre": "SOELEC", "logo": uploaded})

    assert result["logo_url"] == saved.logo_url


def test_delete_only_removes_files_owned_by_clients_path():
    calls = []

    class Repository:
        def get_by_id(self, logo_id):
            return _logo(logo_url="https://cdn.example/external.png")

        def delete(self, logo_id):
            calls.append(("db", logo_id))

    class Storage:
        def delete(self, path):
            calls.append(("storage", path))

    ClientLogoService(repository=Repository(), storage=Storage()).delete_logo(8)

    assert calls == [("db", 8)]


def test_create_rejects_an_empty_logo_record_before_persistence():
    class Repository:
        def create(self, data):
            raise AssertionError("No debe persistir un logo sin origen visual.")

    with pytest.raises(ValueError, match="Adjunta un archivo"):
        ClientLogoService(repository=Repository()).create_logo({"nombre": "Vacío"})
