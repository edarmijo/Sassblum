"""Generate safe, content-addressed WebP variants for public API media.

Only explicitly allowed HTTPS hosts are downloaded. Downloads and decoded
pixel counts are bounded so a malformed admin URL cannot turn this build-time
task into an SSRF, memory-exhaustion, or decompression-bomb vector.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import warnings
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import ParseResult, unquote, urljoin, urlparse, urlunparse

import requests
from PIL import Image, ImageOps


WIDTHS = (320, 640, 960)
COVER_WIDTHS = (320, 640, 960, 1280)
ABOUT_WIDTHS = (320, 640, 960, 1280, 1600)
WEBP_QUALITY = 82
MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024
MAX_IMAGE_PIXELS = 50_000_000
MAX_REDIRECTS = 3
DEFAULT_API_BASE = "https://sassblum.onrender.com/api"
ALLOWED_API_HOSTS = frozenset({"sassblum.onrender.com"})
API_ENDPOINT_URLS = {
    "servicios/": f"{DEFAULT_API_BASE}/servicios/",
    "proyectos/": f"{DEFAULT_API_BASE}/proyectos/",
    "clientes/": f"{DEFAULT_API_BASE}/clientes/",
}
DEFAULT_MEDIA_HOSTS = (
    "images.unsplash.com",
    "opiywavbmidgpzzkkivy.supabase.co",
)
ABOUT_TEAM_IMAGE_URL = (
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
    "?auto=format&fit=crop&w=1600&q=82"
)
ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
MEDIA_DIR = PUBLIC_DIR / "media"
GENERATED_DIR = ROOT / "src" / "generated"
MANIFEST_PATH = GENERATED_DIR / "mediaManifest.ts"
CONTENT_SNAPSHOT_PATH = GENERATED_DIR / "publicContentSnapshot.ts"

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


def _slug(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return normalized or "media"


def _validate_api_base(value: str) -> str:
    """Return a normalized project API URL or reject unsafe CLI input."""
    parsed = urlparse(value)
    if not _has_safe_https_authority(parsed, ALLOWED_API_HOSTS):
        raise ValueError(f"API base URL is not allowed: {value}")

    path = parsed.path.rstrip("/")
    if path != "/api" or parsed.query or parsed.fragment:
        raise ValueError(f"API base path is not allowed: {value}")
    # Return a compile-time constant, not a URL assembled from CLI-controlled text.
    return DEFAULT_API_BASE


def _has_safe_https_authority(parsed: ParseResult, allowed_hosts: frozenset[str]) -> bool:
    """Check scheme and authority without letting an invalid port escape validation."""
    try:
        port = parsed.port
    except ValueError:
        return False
    return (
        parsed.scheme == "https"
        and parsed.hostname in allowed_hosts
        and not parsed.username
        and not parsed.password
        and port in (None, 443)
    )


def _validate_media_host_argument(value: str) -> str:
    """Restrict CLI host entries to the project's audited media providers."""
    normalized = value.strip().lower()
    if normalized not in DEFAULT_MEDIA_HOSTS:
        raise ValueError(f"media host is not allowed: {value}")
    return normalized


def _validated_media_hosts(values: frozenset[str]) -> frozenset[str]:
    """Validate host sets received outside argparse before any network request."""
    return frozenset(_validate_media_host_argument(value) for value in values)


def _fetch_items(api_base: str, endpoint: str) -> list[dict[str, Any]]:
    if endpoint not in API_ENDPOINT_URLS:
        raise ValueError(f"API endpoint is not allowed: {endpoint}")
    _validate_api_base(api_base)
    # This URL is selected from constants only. CLI text never reaches requests.
    request_url = API_ENDPOINT_URLS[endpoint]
    with requests.get(request_url, timeout=90, allow_redirects=False) as response:
        if _redirect_target(response, request_url) is not None:
            raise ValueError(f"API redirects are not allowed: {request_url}")
        response.raise_for_status()
        payload = response.json()
    items = payload.get("items", payload) if isinstance(payload, dict) else payload
    return items if isinstance(items, list) else []


def _canonical_media_url(url: str, allowed_hosts: frozenset[str]) -> str:
    """Return a URL whose network authority comes only from the closed allowlist."""
    parsed = urlparse(url)
    if not _has_safe_https_authority(parsed, allowed_hosts):
        raise ValueError(f"media URL host is not allowed: {url}")
    if parsed.fragment or "\\" in url or any(ord(character) < 32 for character in url):
        raise ValueError(f"media URL is malformed: {url}")

    # Select the authority from trusted constants. The remote path/query cannot
    # change the destination origin, including after a relative redirect.
    canonical_host = next(host for host in allowed_hosts if parsed.hostname == host)
    return urlunparse(("https", canonical_host, parsed.path or "/", "", parsed.query, ""))


def _redirect_target(response: requests.Response, current_url: str) -> str | None:
    if not (response.is_redirect or response.is_permanent_redirect):
        return None
    location = response.headers.get("Location")
    if not location:
        raise ValueError(f"redirect without Location: {current_url}")
    return urljoin(current_url, location)


def _read_bounded_body(response: requests.Response, source_url: str) -> bytes:
    declared_size = int(response.headers.get("Content-Length", "0") or 0)
    if declared_size > MAX_DOWNLOAD_BYTES:
        raise ValueError(f"media exceeds {MAX_DOWNLOAD_BYTES} bytes: {source_url}")

    body = bytearray()
    for chunk in response.iter_content(chunk_size=128 * 1024):
        body.extend(chunk)
        if len(body) > MAX_DOWNLOAD_BYTES:
            raise ValueError(f"media exceeds {MAX_DOWNLOAD_BYTES} bytes: {source_url}")
    return bytes(body)


def _download(url: str, allowed_hosts: frozenset[str]) -> tuple[Image.Image, str]:
    safe_hosts = _validated_media_hosts(allowed_hosts)
    current_url = url
    for _ in range(MAX_REDIRECTS + 1):
        safe_url = _canonical_media_url(current_url, safe_hosts)
        with requests.get(
            safe_url,
            timeout=(10, 120),
            stream=True,
            allow_redirects=False,
        ) as response:
            redirect_target = _redirect_target(response, safe_url)
            if redirect_target is not None:
                current_url = redirect_target
                continue

            response.raise_for_status()
            content = _read_bounded_body(response, url)
            break
    else:
        raise ValueError(f"too many redirects: {url}")

    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        image = Image.open(BytesIO(content))
        if image.width * image.height > MAX_IMAGE_PIXELS:
            raise ValueError(f"media exceeds {MAX_IMAGE_PIXELS} decoded pixels: {url}")
        image.load()
    return ImageOps.exif_transpose(image), hashlib.sha256(content).hexdigest()[:12]


def _save_variants(
    image: Image.Image,
    section: str,
    stem: str,
    *,
    widths: tuple[int, ...] = WIDTHS,
    lossless: bool = False,
) -> dict[str, str]:
    output_dir = MEDIA_DIR / section
    output_dir.mkdir(parents=True, exist_ok=True)

    prepared = image.convert("RGBA" if "A" in image.getbands() else "RGB")
    target_widths = sorted({min(width, prepared.width) for width in widths})
    public_paths: list[tuple[int, str]] = []
    for width in target_widths:
        target_height = max(1, round(prepared.height * width / prepared.width))
        resized = prepared.resize((width, target_height), Image.Resampling.LANCZOS)
        filename = f"{stem}-{width}.webp"
        destination = output_dir / filename
        resized.save(
            destination,
            "WEBP",
            quality=100 if lossless else WEBP_QUALITY,
            method=6,
            lossless=lossless,
        )
        public_paths.append((width, f"/media/{section}/{filename}"))

    preferred_width = min(widths[-1], prepared.width)
    source = min(public_paths, key=lambda item: abs(item[0] - preferred_width))[1]
    source_set = ", ".join(f"{path} {width}w" for width, path in public_paths)
    return {"src": source, "srcSet": source_set}


def _register_remote(
    manifest: dict[str, dict[str, str]],
    url: str,
    section: str,
    identity: str,
    allowed_hosts: frozenset[str],
    *,
    widths: tuple[int, ...] = WIDTHS,
) -> None:
    if not url or url in manifest:
        return
    try:
        image, content_hash = _download(url, allowed_hosts)
        stem = f"{_slug(identity)}-{content_hash}"
        with image:
            manifest[url] = _save_variants(image, section, stem, widths=widths)
        print(f"optimized {section}: {identity}")
    except (ValueError, OSError) as error:
        print(f"skipped {section}: {identity} ({error})")


def _register_local_client_logo(
    manifest: dict[str, dict[str, str]],
    url: str,
) -> None:
    if not url:
        return
    filename = Path(unquote(urlparse(url).path)).name
    local_file = PUBLIC_DIR / "client-logos" / "manual" / filename
    if not local_file.is_file():
        return

    try:
        content = local_file.read_bytes()
        content_hash = hashlib.sha256(content).hexdigest()[:12]
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as image:
                if image.width * image.height > MAX_IMAGE_PIXELS:
                    raise ValueError(f"logo exceeds {MAX_IMAGE_PIXELS} decoded pixels")
                image.load()
                manifest[url] = _save_variants(
                    ImageOps.exif_transpose(image),
                    "clients",
                    f"client-{_slug(local_file.stem)}-{content_hash}",
                    widths=(160, 320, 640) if image.width / max(1, image.height) >= 2.5 else (160, 320),
                    lossless=True,
                )
    except (ValueError, OSError) as error:
        print(f"skipped clients: {filename} ({error})")


def _referenced_media_paths(manifest: dict[str, dict[str, str]]) -> set[Path]:
    referenced: set[Path] = set()
    for variant in manifest.values():
        values = [variant["src"]]
        values.extend(part.rsplit(" ", 1)[0] for part in variant.get("srcSet", "").split(", ") if part)
        for public_path in values:
            if public_path.startswith("/media/"):
                referenced.add((PUBLIC_DIR / public_path.lstrip("/")).resolve())
    return referenced


def _clean_stale_variants(manifest: dict[str, dict[str, str]]) -> None:
    referenced = _referenced_media_paths(manifest)
    media_root = MEDIA_DIR.resolve()
    for section in ("services", "projects", "clients", "public"):
        section_dir = (MEDIA_DIR / section).resolve()
        if media_root not in section_dir.parents:
            raise RuntimeError("refusing to clean outside generated media directory")
        if not section_dir.is_dir():
            continue
        for candidate in section_dir.glob("*.webp"):
            if candidate.resolve() not in referenced:
                candidate.unlink()


def _write_manifest(manifest: dict[str, dict[str, str]]) -> None:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False)
    MANIFEST_PATH.write_text(
        "// Generated by scripts/optimize_public_media.py. Do not edit manually.\n"
        "export interface MediaVariant {\n"
        "  src: string\n"
        "  srcSet?: string\n"
        "}\n\n"
        "export const MEDIA_VARIANTS: Readonly<Record<string, MediaVariant>> = "
        f"{serialized}\n",
        encoding="utf-8",
    )


def _write_content_snapshot(
    services: list[dict[str, Any]],
    projects: list[dict[str, Any]],
    clients: list[dict[str, Any]],
) -> None:
    """Persist public API content so media can paint before a cold backend wakes."""
    service_snapshot = [
        {
            "id": str(service.get("id", "")),
            "nombre": str(service.get("nombre") or ""),
            "descripcion": str(service.get("descripcion") or ""),
            "categoria": str(service.get("categoria") or ""),
            "activo": bool(service.get("activo", True)),
            "imagenUrl": str(service.get("imagen_url") or ""),
            "imagenes": [
                {
                    "id": int(image.get("id", 0)),
                    "imagenUrl": str(image.get("imagen_url") or ""),
                    "orden": int(image.get("orden", 0)),
                }
                for image in service.get("imagenes") or []
            ],
            "descripcionDetalle": str(service.get("descripcion_detalle") or ""),
        }
        for service in services
        if service.get("activo", True)
    ]
    project_snapshot = [
        {
            "id": str(project.get("id", "")),
            "titulo": str(project.get("titulo") or ""),
            "descripcion": str(project.get("descripcion") or ""),
            "tag": str(project.get("tag") or ""),
            "imagenUrl": str(project.get("imagen_url") or ""),
        }
        for project in projects
        if project.get("activo", True)
    ]
    client_snapshot = [
        {
            "id": int(client.get("id", 0)),
            "nombre": str(client.get("nombre") or client.get("name") or ""),
            "logoUrl": str(client.get("logo_url") or client.get("imagen_url") or ""),
            "activo": bool(client.get("activo", True)),
            "orden": int(client.get("orden", 0)),
        }
        for client in clients
        if client.get("activo", True)
    ]

    def serialize(value: object) -> str:
        return json.dumps(value, indent=2, ensure_ascii=False)

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    CONTENT_SNAPSHOT_PATH.write_text(
        "// Generated by scripts/optimize_public_media.py. Do not edit manually.\n"
        "// Render immediately from this snapshot, then refresh silently from the API.\n"
        "import type { ServiceSummary } from '../modules/catalog/interfaces/ICatalogService'\n"
        "import type { ClientLogo } from '../modules/clients/interfaces/IClientLogoService'\n\n"
        "export interface PublicProjectSnapshot {\n"
        "  id: string\n"
        "  titulo: string\n"
        "  descripcion: string\n"
        "  tag: string\n"
        "  imagenUrl: string\n"
        "}\n\n"
        f"export const PUBLIC_SERVICES: ReadonlyArray<ServiceSummary> = {serialize(service_snapshot)}\n\n"
        f"export const PUBLIC_PROJECTS: ReadonlyArray<PublicProjectSnapshot> = {serialize(project_snapshot)}\n\n"
        f"export const PUBLIC_CLIENT_LOGOS: ReadonlyArray<ClientLogo> = {serialize(client_snapshot)}\n",
        encoding="utf-8",
    )


def generate(api_base: str, allowed_hosts: frozenset[str]) -> None:
    manifest: dict[str, dict[str, str]] = {}
    services = _fetch_items(api_base, "servicios/")
    projects = _fetch_items(api_base, "proyectos/")
    clients = _fetch_items(api_base, "clientes/")

    _register_remote(
        manifest,
        ABOUT_TEAM_IMAGE_URL,
        "public",
        "about-team",
        allowed_hosts,
        widths=ABOUT_WIDTHS,
    )

    for service in services:
        service_id = str(service.get("id", "service"))
        _register_remote(
            manifest,
            str(service.get("imagen_url") or ""),
            "services",
            f"service-{service_id}-cover",
            allowed_hosts,
            widths=COVER_WIDTHS,
        )
        for image in service.get("imagenes") or []:
            _register_remote(
                manifest,
                str(image.get("imagen_url") or ""),
                "services",
                f"service-{service_id}-gallery-{image.get('id', 'image')}",
                allowed_hosts,
            )

    for project in projects:
        _register_remote(
            manifest,
            str(project.get("imagen_url") or ""),
            "projects",
            f"project-{project.get('id', 'project')}",
            allowed_hosts,
        )

    for client in clients:
        _register_local_client_logo(manifest, str(client.get("logo_url") or ""))

    _clean_stale_variants(manifest)
    _write_manifest(manifest)
    _write_content_snapshot(services, projects, clients)
    print(f"wrote {len(manifest)} mappings to {MANIFEST_PATH}")
    print(f"wrote public content snapshot to {CONTENT_SNAPSHOT_PATH}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--api-base",
        default=DEFAULT_API_BASE,
        type=_validate_api_base,
        help="Audited HTTPS public API base URL.",
    )
    parser.add_argument(
        "--allowed-media-host",
        action="append",
        default=list(DEFAULT_MEDIA_HOSTS),
        type=_validate_media_host_argument,
        help="Audited HTTPS media hostname; repeat as needed.",
    )
    args = parser.parse_args()
    generate(args.api_base, frozenset(args.allowed_media_host))


if __name__ == "__main__":
    main()
