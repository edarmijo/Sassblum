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
from apps.tickets.services.storage_name import storage_filename  # noqa: E402
from apps.tickets.services.storage_service import StorageService  # noqa: E402
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
    parser.add_argument("--include-gallery", action="store_true", help="Upload configured extra image folders too.")
    parser.add_argument("--execute", action="store_true", help="Upload and update matching service records.")
    return parser.parse_args()


def image_sort_key(path: Path) -> tuple[int, str]:
    match = re.match(r"\d+", path.stem)
    return (int(match.group()) if match else sys.maxsize, path.name.casefold())


def find_service(name: str) -> Service | None:
    try:
        return Service.objects.get(nombre=name)
    except Service.DoesNotExist:
        print(f"Service not found (skipped): {name}", file=sys.stderr)
        return None


def collect_cover_items(images_dir: Path) -> list[tuple[Service, Path]]:
    items: list[tuple[Service, Path]] = []
    for service_name, filename in COVERS.items():
        service = find_service(service_name)
        file_path = images_dir / filename
        if service is None or not file_path.is_file():
            if service is not None:
                print(f"Image not found (skipped): {file_path}", file=sys.stderr)
            continue
        items.append((service, file_path))
    return items


def collect_gallery_items(images_dir: Path) -> list[tuple[Service, Path]]:
    items: list[tuple[Service, Path]] = []
    for service_name, directory_name in EXTRA_GALLERIES.items():
        service = find_service(service_name)
        directory = images_dir / directory_name
        if service is None or not directory.is_dir():
            continue
        files = sorted(
            (path for path in directory.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".png"}),
            key=image_sort_key,
        )
        items.extend((service, file_path) for file_path in files)
    return items


def report_items(items: list[tuple[Service, Path]], execute: bool, gallery: bool = False) -> None:
    action = "Uploading" if execute else "Would upload"
    prefix = "gallery " if gallery else ""
    for service, file_path in items:
        print(f"{action} {prefix}{file_path.name} -> {service.nombre}")


def upload_covers(storage: StorageService, items: list[tuple[Service, Path]]) -> None:
    for service, file_path in items:
        with file_path.open("rb") as image_file:
            url = storage.upload(
                File(image_file, name=file_path.name),
                f"services/{service.id}/cover/{storage_filename(file_path.name)}",
            )
        service.imagen_url = url
        service.save(update_fields=["imagen_url", "updated_at"])
        print(f"Uploaded cover for service {service.id}: {service.nombre}")


def upload_gallery_images(storage: StorageService, items: list[tuple[Service, Path]]) -> None:
    catalog_service = CatalogService(storage=storage)
    for service, file_path in items:
        path = f"services/{service.id}/gallery/{storage_filename(file_path.name)}"
        if service.imagenes.filter(imagen_url=storage.get_url(path)).exists():
            print(f"Gallery image already linked (skipped): {file_path.name}")
            continue
        with file_path.open("rb") as image_file:
            catalog_service.add_service_image(service.id, File(image_file, name=file_path.name))
        print(f"Uploaded gallery image for service {service.id}: {service.nombre}")


def main() -> int:
    args = parse_args()
    images_dir: Path = args.images_dir
    if not images_dir.is_dir():
        print(f"Directory not found: {images_dir}", file=sys.stderr)
        return 2

    covers = collect_cover_items(images_dir)
    galleries = collect_gallery_items(images_dir) if args.include_gallery else []
    report_items(covers, args.execute)
    report_items(galleries, args.execute, gallery=True)
    if not args.execute:
        return 0

    storage = StorageService()
    if not storage._enabled:  # noqa: SLF001 - capability guard before mutations
        print("Supabase Storage is not configured.", file=sys.stderr)
        return 3
    upload_covers(storage, covers)
    upload_gallery_images(storage, galleries)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
