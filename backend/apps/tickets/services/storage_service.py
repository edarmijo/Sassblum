"""
StorageService — concrete IStorageService backed by Supabase Storage (REST API).

Responsibility (SRP): persist binary files and return their public URL. Uploads to a
    Supabase Storage bucket via its REST API using `requests` (no extra dependency).
    If Supabase credentials are not configured it falls back to a deterministic stub
    URL so the end-to-end flow still works in local dev without a bucket.
Pattern: Strategy/Adapter behind IStorageService — swapping providers (S3, GCS) requires
    no change to TicketService or CatalogService (OCP/DIP/LSP).
SOLID: SRP · DIP · LSP · OCP

Config (settings / .env):
    SUPABASE_URL            e.g. https://xyzcompany.supabase.co
    SUPABASE_SERVICE_KEY    service_role key (server-side only — never expose to FE)
    SUPABASE_STORAGE_BUCKET e.g. "sassblum" (must exist and be public for get_url)
"""

from __future__ import annotations

import mimetypes

import requests
from django.conf import settings

from apps.tickets.interfaces import IStorageService

_STUB_BASE_URL = "/media"

# H#17 (audit): Allowed MIME types for uploads — defense-in-depth.
_ALLOWED_MIME_TYPES = frozenset([
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
])


class StorageService(IStorageService):

    def __init__(self) -> None:
        self._base = (getattr(settings, "SUPABASE_URL", "") or "").rstrip("/")
        self._key = getattr(settings, "SUPABASE_SERVICE_KEY", "") or ""
        self._bucket = getattr(settings, "SUPABASE_STORAGE_BUCKET", "") or "sassblum"

    # ── Capability check ────────────────────────────────────────────────────────

    @property
    def _enabled(self) -> bool:
        return bool(self._base and self._key)

    # ── IStorageService ─────────────────────────────────────────────────────────

    def upload(self, file, path: str) -> str:
        path = path.lstrip("/")
        if not self._enabled:
            # Supabase not configured: return empty string so callers skip the
            # DB update and image fields stay null instead of storing a broken
            # relative path that the browser can't resolve.
            return ""

        # H#17 (audit): Validate MIME type server-side — OWASP defense-in-depth
        content_type = (
            getattr(file, "content_type", None)
            or mimetypes.guess_type(path)[0]
            or "application/octet-stream"
        )
        if content_type not in _ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Tipo de archivo no permitido: {content_type}. "
                f"Tipos permitidos: {', '.join(sorted(_ALLOWED_MIME_TYPES))}"
            )

        content_type = (
            getattr(file, "content_type", None)
            or mimetypes.guess_type(path)[0]
            or "application/octet-stream"
        )
        try:
            file.seek(0)
        except Exception:  # noqa: BLE001 - some file-likes are not seekable
            pass
        data = file.read()

        url = f"{self._base}/storage/v1/object/{self._bucket}/{path}"
        resp = requests.post(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {self._key}",
                "apikey": self._key,
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            timeout=30,
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Supabase upload failed ({resp.status_code}): {resp.text}")
        return self.get_url(path)

    def delete(self, path: str) -> None:
        path = path.lstrip("/")
        if not self._enabled:
            return None
        url = f"{self._base}/storage/v1/object/{self._bucket}/{path}"
        requests.delete(
            url,
            headers={"Authorization": f"Bearer {self._key}", "apikey": self._key},
            timeout=30,
        )
        return None

    def get_url(self, path: str) -> str:
        path = path.lstrip("/")
        if not self._enabled:
            return f"{_STUB_BASE_URL}/{path}"
        return f"{self._base}/storage/v1/object/public/{self._bucket}/{path}"
