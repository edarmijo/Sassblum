"""Unit tests for gallery upload object names (no database)."""

from types import SimpleNamespace
import re

from apps.gallery.services.gallery_service import GalleryService


def test_project_upload_uses_a_safe_storage_filename():
    project = SimpleNamespace(id=4)
    uploaded = SimpleNamespace(name="Recepción corporativa.jpg")

    class Storage:
        def upload(self, file, path):
            assert file is uploaded
            assert re.fullmatch(r"gallery/4/Recepcion-corporativa-[0-9a-f]{12}\.jpg", path)
            return "https://cdn.example/project.jpg"

    class Repository:
        def update(self, project_id, values):
            assert (project_id, values) == (4, {"imagen_url": "https://cdn.example/project.jpg"})
            return "updated-project"

    result = GalleryService(project_repository=Repository(), storage=Storage())._maybe_attach_image(
        project,
        uploaded,
    )

    assert result == "updated-project"
