"""Upload service cover and gallery images to Supabase Storage.

Usage (from backend):
    python scripts/upload_service_covers.py --images-dir "C:\\path\\to\\SERVICIOS" --include-gallery --execute

Without --execute the script performs a safe dry run. Credentials come only from
Django settings; they are never accepted as command-line arguments or printed.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from apps.catalog.models import Service  # noqa: E402
from apps.catalog.services.catalog_service import CatalogService  # noqa: E402
from apps.tickets.services.storage_service import StorageService  # noqa: E402
from apps.tickets.services.storage_name import storage_filename  # noqa: E402
from django.core.files import File  # noqa: E402


COVERS = {
    "Infraestructura IT": "infraestructura ti.jpg",
    "Soporte Técnico": "soporte tecnico.jpg",
    "Cableado Estructurado": "cable estructurado.jpg",
    "Sistema de Vigilancia CCTV": "Sistema de vigilancia CCTV.jpg",
    "Domótica": "Domótica.jpg",
    "Venta de Servidores": "Venta de servidores.jpg",
}

EXTRA_GALLERIES = {
    "Infraestructura IT": "imagenes extra infraestructura IT",
    "Soporte Técnico": "imagenes extra Soporte Técnico",
    "Cableado Estructurado": "imagenes extra Cableado estructurado",
    "Sistema de Vigilancia CCTV": "imagenes extra Sistema de vigilancia CCTV",
    "Domótica": "imagenes extra Domótica",
    "Venta de Servidores": "imagenes extra Venta de servidores",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--images-dir", required=True, type=Path)
    parser.add_argument(
        "--include-gallery",
        action="store_true",
        help="Also upload image files from each configured 'imagenes extra' directory.",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Upload and update the six matching service records.",
    )
    return parser.parse_args()


def image_sort_key(path: Path) -> tuple[int, str]:
    """Sort `1 (1).jpeg`, `2.jpeg`, `10.jpeg` in natural numeric order."""
    match = re.match(r"\d+", path.stem)
    return (int(match.group()) if match else sys.maxsize, path.name.casefold())


def main() -> int:
    args = parse_args()
    images_dir: Path = args.images_dir
    if not images_dir.is_dir():
        print(f"Directory not found: {images_dir}", file=sys.stderr)
        return 2

    items: list[tuple[Service, Path]] = []
    for service_name, filename in COVERS.items():
        try:
            service = Service.objects.get(nombre=service_name)
        except Service.DoesNotExist:
            print(f"Service not found (skipped): {service_name}", file=sys.stderr)
            continue
        file_path = images_dir / filename
        if not file_path.is_file():
            print(f"Image not found (skipped): {file_path}", file=sys.stderr)
            continue
        items.append((service, file_path))

    for service, file_path in items:
        print(f"{'Would upload' if not args.execute else 'Uploading'} {file_path.name} -> {service.nombre}")

    gallery_items: list[tuple[Service, Path]] = []
    if args.include_gallery:
        for service_name, directory_name in EXTRA_GALLERIES.items():
            try:
                service = Service.objects.get(nombre=service_name)
            except Service.DoesNotExist:
                print(f"Service not found (gallery skipped): {service_name}", file=sys.stderr)
                continue
            directory = images_dir / directory_name
            files = sorted(
                (path for path in directory.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".png"}),
                key=image_sort_key,
            ) if directory.is_dir() else []
            for file_path in files:
                gallery_items.append((service, file_path))
                print(
                    f"{'Would upload' if not args.execute else 'Uploading'} gallery "
                    f"{file_path.name} -> {service.nombre}"
                )
    if not args.execute:
        return 0

    storage = StorageService()
    if not storage._enabled:  # noqa: SLF001 - capability guard before mutating data
        print("Supabase Storage is not configured.", file=sys.stderr)
        return 3

    for service, file_path in items:
        with file_path.open("rb") as image_file:
            uploaded_file = File(image_file, name=file_path.name)
            url = storage.upload(
                uploaded_file,
                f"services/{service.id}/cover/{storage_filename(file_path.name)}",
            )
        service.imagen_url = url
        service.save(update_fields=["imagen_url", "updated_at"])
        print(f"Uploaded cover for service {service.id}: {service.nombre}")

    catalog_service = CatalogService(storage=storage)
    for service, file_path in gallery_items:
        path = f"services/{service.id}/gallery/{storage_filename(file_path.name)}"
        url = storage.get_url(path)
        if service.imagenes.filter(imagen_url=url).exists():
            print(f"Gallery image already linked (skipped): {file_path.name}")
            continue
        with file_path.open("rb") as image_file:
            catalog_service.add_service_image(service.id, File(image_file, name=file_path.name))
        print(f"Uploaded gallery image for service {service.id}: {file_path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
