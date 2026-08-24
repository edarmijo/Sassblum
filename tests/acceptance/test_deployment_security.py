"""Regression checks for deployment security configuration."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_backend_dependencies_use_patched_versions_and_verified_hashes() -> None:
    requirements = (ROOT / "backend" / "requirements.txt").read_text(encoding="utf-8")
    lock = (ROOT / "backend" / "requirements.lock").read_text(encoding="utf-8")

    assert "Django==6.0.8" in requirements
    assert "sqlparse==0.6.0" in requirements
    assert "Django==6.0.7" not in requirements
    assert "sqlparse==0.5.5" not in requirements
    assert (
        "Django==6.0.8 "
        "--hash=sha256:9b98b7e1902e0e575ea4f42c175fc9512784f7f2580898286aee3388b322219d"
        in lock
    )
    assert (
        "sqlparse==0.6.0 "
        "--hash=sha256:b861c0288ce2fa56209a9a6412d2e066ac664b3873b89c26c9d8415e8e32996f"
        in lock
    )


def test_vercel_applies_required_security_headers_globally() -> None:
    config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    global_rule = next(rule for rule in config["headers"] if rule["source"] == "/(.*)")
    headers = {item["key"]: item["value"] for item in global_rule["headers"]}

    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert headers["Cross-Origin-Opener-Policy"] == "same-origin"
    assert headers["X-Permitted-Cross-Domain-Policies"] == "none"
    assert headers["Permissions-Policy"] == (
        "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    )

    content_security_policy = headers["Content-Security-Policy"]
    for directive in (
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "connect-src 'self' https://sassblum.onrender.com wss://sassblum.onrender.com",
        "upgrade-insecure-requests",
    ):
        assert directive in content_security_policy
