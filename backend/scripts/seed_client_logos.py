"""Upload approved client logos and publish them in the public carousel.

Usage (from backend):
    python scripts/seed_client_logos.py --assets-dir "..\\frontend\\public\\client-logos\\manual" --execute

Run without ``--execute`` first to review the exact mutations. Credentials are
read only from Django settings and are never printed.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from apps.clientes.models import ClientLogo  # noqa: E402
from apps.clientes.services import ClientLogoService  # noqa: E402
from apps.tickets.services.storage_service import StorageService  # noqa: E402
from django.core.files import File  # noqa: E402


LOGOS: tuple[tuple[str, str], ...] = (
    ("SCD — Sistema de Control Documental", "scd.png"),
    ("Velázquez Velázquez Abogados", "velazquez-velazquez-abogados.png"),
    ("La Sevillana", "la-sevillana.png"),
    ("Acería Xinlong S.A.", "aceria-xinlong.png"),
    ("Banapov", "banapov.png"),
    ("Omaconsa — Automatización y Control S.A.", "omaconsa.png"),
    ("IMDO — Sport Medical Center", "imdo.png"),
    ("Soelec — Soluciones Eléctricas S.A.", "soelec.png"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets-dir", required=True, type=Path)
    parser.add_argument("--execute", action="store_true", help="Upload files and create/update records.")
    return parser.parse_args()


def collect_records(assets_dir: Path, execute: bool) -> list[tuple[int, str, Path, ClientLogo | None]]:
    records: list[tuple[int, str, Path, ClientLogo | None]] = []
    for order, (name, filename) in enumerate(LOGOS, start=1):
        file_path = assets_dir / filename
        if not file_path.is_file():
            print(f"Image missing (skipped): {file_path}", file=sys.stderr)
            continue
        existing = ClientLogo.objects.filter(nombre=name).first() if execute else None
        records.append((order, name, file_path, existing))
        action = "update" if records[-1][3] else "create"
        print(f"Would {action} client logo: {name} ({filename})")
    return records


def configured_storage() -> StorageService | None:
    storage = StorageService()
    if not storage._enabled:  # noqa: SLF001 - explicit guard before mutations
        print("Supabase Storage is not configured.", file=sys.stderr)
        return None
    return storage


def publish_logo(
    service: ClientLogoService,
    order: int,
    name: str,
    file_path: Path,
    existing: ClientLogo | None,
) -> None:
    if existing and existing.logo_url:
        service.edit_logo(existing.id, {"orden": order, "activo": True})
        print(f"Updated order for existing logo: {name}")
        return
    with file_path.open("rb") as image_file:
        payload = {"nombre": name, "orden": order, "activo": True}
        uploaded = File(image_file, name=file_path.name)
        if existing:
            service.edit_logo(existing.id, {**payload, "logo": uploaded})
            print(f"Uploaded missing image for existing logo: {name}")
            return
        service.create_logo({**payload, "logo": uploaded})
        print(f"Created and uploaded client logo: {name}")


def main() -> int:
    args = parse_args()
    assets_dir: Path = args.assets_dir
    if not assets_dir.is_dir():
        print(f"Assets directory not found: {assets_dir}", file=sys.stderr)
        return 2

    records = collect_records(assets_dir, args.execute)
    if not args.execute:
        return 0

    storage = configured_storage()
    if storage is None:
        return 3
    service = ClientLogoService(storage=storage)
    for record in records:
        publish_logo(service, *record)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
