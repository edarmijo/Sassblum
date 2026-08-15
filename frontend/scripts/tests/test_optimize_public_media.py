"""Unit tests for the public-media optimizer's network boundary."""

from __future__ import annotations

import importlib.util
import io
import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest.mock import MagicMock, patch

from PIL import Image


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "optimize_public_media.py"
SPEC = importlib.util.spec_from_file_location("optimize_public_media", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:  # pragma: no cover - import guard
    raise RuntimeError(f"Could not load {SCRIPT_PATH}")
MEDIA_OPTIMIZER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MEDIA_OPTIMIZER)


class FakeResponse:
    """Minimal requests response context manager used without real network I/O."""

    def __init__(
        self,
        *,
        body: bytes = b"",
        headers: dict[str, str] | None = None,
        redirect: bool = False,
        payload: object = None,
    ) -> None:
        self.body = body
        self.headers = headers or {}
        self.is_redirect = redirect
        self.is_permanent_redirect = False
        self.payload = payload

    def __enter__(self) -> FakeResponse:
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def raise_for_status(self) -> None:
        return None

    def iter_content(self, chunk_size: int) -> list[bytes]:
        return [self.body[index : index + chunk_size] for index in range(0, len(self.body), chunk_size)]

    def json(self) -> object:
        return self.payload


class NetworkBoundaryTests(unittest.TestCase):
    def test_api_base_accepts_only_the_audited_origin_and_path(self) -> None:
        self.assertEqual(
            MEDIA_OPTIMIZER._validate_api_base("https://sassblum.onrender.com/api/"),
            "https://sassblum.onrender.com/api",
        )

        unsafe_values = (
            "http://sassblum.onrender.com/api",
            "https://127.0.0.1/api",
            "https://localhost/api",
            "https://sassblum.onrender.com.evil.example/api",
            "https://sassblum.onrender.com@127.0.0.1/api",
            "https://sassblum.onrender.com:444/api",
            "https://sassblum.onrender.com:invalid/api",
            "https://sassblum.onrender.com/api?redirect=https://127.0.0.1",
            "https://sassblum.onrender.com/not-api",
        )
        for value in unsafe_values:
            with self.subTest(value=value), self.assertRaises(ValueError):
                MEDIA_OPTIMIZER._validate_api_base(value)

    def test_media_host_argument_is_a_closed_allowlist(self) -> None:
        for host in MEDIA_OPTIMIZER.DEFAULT_MEDIA_HOSTS:
            self.assertEqual(MEDIA_OPTIMIZER._validate_media_host_argument(host.upper()), host)

        for value in ("127.0.0.1", "localhost", "https://images.unsplash.com", "evil.example"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                MEDIA_OPTIMIZER._validate_media_host_argument(value)

    def test_fetch_rejects_unsafe_api_base_before_request(self) -> None:
        with patch.object(MEDIA_OPTIMIZER.requests, "get") as request_get:
            with self.assertRaises(ValueError):
                MEDIA_OPTIMIZER._fetch_items("https://127.0.0.1/api", "servicios/")
            request_get.assert_not_called()

    def test_fetch_rejects_unknown_endpoint_before_request(self) -> None:
        with patch.object(MEDIA_OPTIMIZER.requests, "get") as request_get:
            with self.assertRaisesRegex(ValueError, "endpoint is not allowed"):
                MEDIA_OPTIMIZER._fetch_items(MEDIA_OPTIMIZER.DEFAULT_API_BASE, "../admin/")
            request_get.assert_not_called()

    def test_fetch_disables_and_rejects_api_redirects(self) -> None:
        response = FakeResponse(headers={"Location": "https://127.0.0.1/internal"}, redirect=True)
        with patch.object(MEDIA_OPTIMIZER.requests, "get", return_value=response) as request_get:
            with self.assertRaisesRegex(ValueError, "API redirects are not allowed"):
                MEDIA_OPTIMIZER._fetch_items(MEDIA_OPTIMIZER.DEFAULT_API_BASE, "servicios/")
        request_get.assert_called_once_with(
            "https://sassblum.onrender.com/api/servicios/",
            timeout=90,
            allow_redirects=False,
        )

    def test_fetch_uses_constant_endpoint_url_and_parses_items(self) -> None:
        response = FakeResponse(payload={"items": [{"id": 7}]})
        with patch.object(MEDIA_OPTIMIZER.requests, "get", return_value=response) as request_get:
            items = MEDIA_OPTIMIZER._fetch_items(
                "https://SASSBLUM.ONRENDER.COM/api/",
                "proyectos/",
            )
        self.assertEqual(items, [{"id": 7}])
        request_get.assert_called_once_with(
            "https://sassblum.onrender.com/api/proyectos/",
            timeout=90,
            allow_redirects=False,
        )

    def test_cli_rejects_unsafe_api_base_before_generation(self) -> None:
        argv = [str(SCRIPT_PATH), "--api-base", "https://127.0.0.1/api"]
        with (
            patch.object(sys, "argv", argv),
            patch.object(MEDIA_OPTIMIZER, "generate") as generate,
            redirect_stderr(io.StringIO()),
            self.assertRaises(SystemExit),
        ):
            MEDIA_OPTIMIZER.main()
        generate.assert_not_called()

    def test_cli_rejects_unapproved_media_host_before_generation(self) -> None:
        argv = [str(SCRIPT_PATH), "--allowed-media-host", "127.0.0.1"]
        with (
            patch.object(sys, "argv", argv),
            patch.object(MEDIA_OPTIMIZER, "generate") as generate,
            redirect_stderr(io.StringIO()),
            self.assertRaises(SystemExit),
        ):
            MEDIA_OPTIMIZER.main()
        generate.assert_not_called()

    def test_download_rejects_programmatic_host_allowlist_before_request(self) -> None:
        with patch.object(MEDIA_OPTIMIZER.requests, "get") as request_get:
            with self.assertRaisesRegex(ValueError, "media host is not allowed"):
                MEDIA_OPTIMIZER._download(
                    "https://127.0.0.1/internal",
                    frozenset({"127.0.0.1"}),
                )
            request_get.assert_not_called()

    def test_download_rejects_unapproved_url_before_request(self) -> None:
        with patch.object(MEDIA_OPTIMIZER.requests, "get") as request_get:
            with self.assertRaisesRegex(ValueError, "host is not allowed"):
                MEDIA_OPTIMIZER._download(
                    "https://127.0.0.1/internal",
                    frozenset(MEDIA_OPTIMIZER.DEFAULT_MEDIA_HOSTS),
                )
            request_get.assert_not_called()

    def test_redirect_is_revalidated_before_following_it(self) -> None:
        response = FakeResponse(headers={"Location": "https://127.0.0.1/internal"}, redirect=True)
        with patch.object(MEDIA_OPTIMIZER.requests, "get", return_value=response) as request_get:
            with self.assertRaisesRegex(ValueError, "host is not allowed"):
                MEDIA_OPTIMIZER._download(
                    "https://images.unsplash.com/photo.jpg",
                    frozenset(MEDIA_OPTIMIZER.DEFAULT_MEDIA_HOSTS),
                )
        request_get.assert_called_once()

    def test_relative_redirect_stays_on_the_canonical_allowed_host(self) -> None:
        redirect = FakeResponse(headers={"Location": "/next.png"}, redirect=True)
        image_bytes = io.BytesIO()
        Image.new("RGB", (2, 2), "blue").save(image_bytes, format="PNG")
        final = FakeResponse(body=image_bytes.getvalue())
        with patch.object(MEDIA_OPTIMIZER.requests, "get", side_effect=(redirect, final)) as request_get:
            image, _ = MEDIA_OPTIMIZER._download(
                "https://images.unsplash.com/photo.jpg",
                frozenset(MEDIA_OPTIMIZER.DEFAULT_MEDIA_HOSTS),
            )
        self.addCleanup(image.close)
        self.assertEqual(request_get.call_args_list[1].args[0], "https://images.unsplash.com/next.png")

    def test_download_stops_after_the_redirect_limit(self) -> None:
        response = FakeResponse(headers={"Location": "/again.png"}, redirect=True)
        with patch.object(MEDIA_OPTIMIZER.requests, "get", return_value=response) as request_get:
            with self.assertRaisesRegex(ValueError, "too many redirects"):
                MEDIA_OPTIMIZER._download(
                    "https://images.unsplash.com/photo.jpg",
                    frozenset(MEDIA_OPTIMIZER.DEFAULT_MEDIA_HOSTS),
                )
        self.assertEqual(request_get.call_count, MEDIA_OPTIMIZER.MAX_REDIRECTS + 1)

    def test_download_keeps_byte_and_pixel_limits(self) -> None:
        oversized = FakeResponse(headers={"Content-Length": str(MEDIA_OPTIMIZER.MAX_DOWNLOAD_BYTES + 1)})
        with patch.object(MEDIA_OPTIMIZER.requests, "get", return_value=oversized):
            with self.assertRaisesRegex(ValueError, "media exceeds"):
                MEDIA_OPTIMIZER._download(
                    "https://images.unsplash.com/photo.jpg",
                    frozenset(MEDIA_OPTIMIZER.DEFAULT_MEDIA_HOSTS),
                )

        image_bytes = io.BytesIO()
        Image.new("RGB", (2, 2)).save(image_bytes, format="PNG")
        response = FakeResponse(body=image_bytes.getvalue())
        with (
            patch.object(MEDIA_OPTIMIZER.requests, "get", return_value=response),
            patch.object(MEDIA_OPTIMIZER, "MAX_IMAGE_PIXELS", 3),
            self.assertRaisesRegex(ValueError, "decoded pixels"),
        ):
            MEDIA_OPTIMIZER._download(
                "https://images.unsplash.com/photo.jpg",
                frozenset(MEDIA_OPTIMIZER.DEFAULT_MEDIA_HOSTS),
            )

    def test_allowed_image_download_uses_no_automatic_redirects(self) -> None:
        image_bytes = io.BytesIO()
        Image.new("RGB", (2, 2), "blue").save(image_bytes, format="PNG")
        response = FakeResponse(body=image_bytes.getvalue())
        with patch.object(MEDIA_OPTIMIZER.requests, "get", return_value=response) as request_get:
            image, content_hash = MEDIA_OPTIMIZER._download(
                "https://images.unsplash.com/photo.jpg",
                frozenset(MEDIA_OPTIMIZER.DEFAULT_MEDIA_HOSTS),
            )
        self.addCleanup(image.close)
        self.assertEqual(image.size, (2, 2))
        self.assertEqual(len(content_hash), 12)
        request_get.assert_called_once_with(
            "https://images.unsplash.com/photo.jpg",
            timeout=(10, 120),
            stream=True,
            allow_redirects=False,
        )

    def test_content_snapshot_contains_only_active_public_records(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            snapshot_path = Path(temporary_directory) / "publicContentSnapshot.ts"
            services = [
                {"id": 1, "nombre": "Visible", "activo": True, "imagen_url": "https://example.com/a.webp"},
                {"id": 2, "nombre": "Oculto", "activo": False, "imagen_url": "https://example.com/b.webp"},
            ]
            projects = [{"id": 3, "titulo": "Proyecto", "activo": True}]
            clients = [{"id": 4, "nombre": "Cliente", "logo_url": "https://example.com/logo.webp"}]

            with patch.object(MEDIA_OPTIMIZER, "CONTENT_SNAPSHOT_PATH", snapshot_path):
                MEDIA_OPTIMIZER._write_content_snapshot(services, projects, clients)

            generated = snapshot_path.read_text(encoding="utf-8")
            self.assertIn('"nombre": "Visible"', generated)
            self.assertNotIn('"nombre": "Oculto"', generated)
            self.assertIn('"titulo": "Proyecto"', generated)
            self.assertIn('"nombre": "Cliente"', generated)


if __name__ == "__main__":
    unittest.main()
