"""Upload the approved SassBlum client-logo sheet to Supabase Storage.

Usage (from backend):
    python scripts/upload_client_logo_sheet.py --file "C:\\path\\to\\clients.png" --execute

The operation is a dry run until ``--execute`` is specified. Credentials are
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

from apps.tickets.services.storage_name import storage_filename  # noqa: E402
from apps.tickets.services.storage_service import StorageService  # noqa: E402
from django.core.files import File  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", required=True, type=Path, help="Approved client-logo sheet image.")
    parser.add_argument(
        "--object-name",
        default="sassblum-clientes.png",
        help="Destination filename inside the clients/ folder.",
    )
    parser.add_argument("--execute", action="store_true", help="Upload the file to Supabase Storage.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source: Path = args.file
    if not source.is_file():
        print(f"Image not found: {source}", file=sys.stderr)
        return 2

    object_path = f"clients/{storage_filename(args.object_name)}"
    if not args.execute:
        print(f"Would upload {source.name} -> {object_path}")
        return 0

    storage = StorageService()
    if not storage._enabled:  # noqa: SLF001 - capability guard before mutation
        print("Supabase Storage is not configured.", file=sys.stderr)
        return 3

    with source.open("rb") as image_file:
        url = storage.upload(File(image_file, name=source.name), object_path)
    print(f"Published approved client-logo sheet: {url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
