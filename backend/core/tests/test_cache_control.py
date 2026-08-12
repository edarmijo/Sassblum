from __future__ import annotations

from rest_framework.response import Response

from core.http import public_cache


def test_public_cache_adds_browser_and_cdn_directives() -> None:
    response = public_cache(Response({"items": []}))

    cache_control = response["Cache-Control"]
    assert "public" in cache_control
    assert "max-age=60" in cache_control
    assert "s-maxage=300" in cache_control
    assert "stale-while-revalidate=86400" in cache_control
