"""Verify that every active gallery and catalog image is publicly reachable.

Run from ``backend``:
    python scripts/verify_public_media.py
"""

from __future__ import annotations

import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from apps.catalog.models import Service  # noqa: E402
from apps.gallery.models import Project  # noqa: E402


def _status(url: str) -> int:
    request = Request(url, method="HEAD")
    try:
        with urlopen(request, timeout=8) as response:  # noqa: S310 - URLs come from the trusted database.
            return response.status
    except HTTPError as error:
        if error.code != 405:
            return error.code
    except URLError:
        return 0

    try:
        with urlopen(url, timeout=8) as response:  # noqa: S310 - see above.
            return response.status
    except URLError as error:
        return getattr(error, "code", 0)


def main() -> int:
    media = [("project", project.id, project.imagen_url) for project in Project.objects.filter(activo=True)]
    for service in Service.objects.filter(activo=True).prefetch_related("imagenes"):
        media.append(("service cover", service.id, service.imagen_url))
        media.extend(("service gallery", service.id, image.imagen_url) for image in service.imagenes.all())

    def check(item: tuple[str, int, str]) -> tuple[str, int, str, int]:
        kind, owner_id, url = item
        return kind, owner_id, url, _status(url) if url else 0

    failures: list[tuple[str, int, int, str]] = []
    with ThreadPoolExecutor(max_workers=12) as executor:
        checks = executor.map(check, media)
        for kind, owner_id, url, status in checks:
            print(f"[{status}] {kind} {owner_id}: {url}")
            if not 200 <= status < 300:
                failures.append((kind, owner_id, status, url))

    print(f"Checked {len(media)} public media URLs; {len(failures)} failed.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
