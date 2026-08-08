"""Unit tests for catalog service image gallery behaviour (no database)."""

from types import SimpleNamespace

from apps.catalog.services.catalog_service import CatalogService
from apps.tickets.services.storage_name import storage_filename


class _Images:
    def __init__(self, images):
        self._images = images

    def all(self):
        return self._images


def _service(images=()):
    return SimpleNamespace(
        id=7,
        nombre="Infraestructura IT",
        descripcion="Resumen",
        descripcion_detalle="Descripción para el modal",
        categoria="Infraestructura",
        activo=True,
        imagen_url="https://cdn.example/cover.jpg",
        imagenes=_Images(images),
    )


def test_summary_includes_cover_detail_and_ordered_gallery_data():
    image = SimpleNamespace(id=3, imagen_url="https://cdn.example/gallery.jpg", orden=0)

    result = CatalogService._summary(_service([image]))

    assert result["imagen_url"] == "https://cdn.example/cover.jpg"
    assert result["descripcion_detalle"] == "Descripción para el modal"
    assert result["imagenes"] == [
        {"id": 3, "imagen_url": "https://cdn.example/gallery.jpg", "orden": 0}
    ]


def test_add_service_image_uses_service_gallery_path_and_next_order():
    uploaded = SimpleNamespace(name="rack.jpg")
    created = SimpleNamespace(id=12, imagen_url="https://cdn.example/rack.jpg", orden=2)

    class Repository:
        def get_by_id(self, service_id):
            assert service_id == 7
            return _service()

        def get_next_order(self, service_id):
            assert service_id == 7
            return 2

        def add_image(self, service_id, image_url, order):
            assert (service_id, image_url, order) == (7, "https://cdn.example/rack.jpg", 2)
            return created

    class Storage:
        def upload(self, file, path):
            assert file is uploaded
            assert path == "services/7/gallery/rack.jpg"
            return "https://cdn.example/rack.jpg"

    result = CatalogService(service_repository=Repository(), storage=Storage()).add_service_image(7, uploaded)

    assert result == {"id": 12, "imagen_url": "https://cdn.example/rack.jpg", "orden": 2}


def test_storage_filename_removes_accents_and_unsafe_characters():
    assert storage_filename("Domótica final (1).JPG") == "Domotica-final-1.jpg"
