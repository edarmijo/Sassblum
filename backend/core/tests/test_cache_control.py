from __future__ import annotations

from rest_framework.response import Response

from core.http import public_cache


def test_public_cache_requires_origin_revalidation() -> None:
    response = public_cache(Response({"items": []}))

    cache_control = response["Cache-Control"]
    assert "public" in cache_control
    assert "no-cache" in cache_control
    assert "must-revalidate" in cache_control
    assert "max-age" not in cache_control
    assert "s-maxage" not in cache_control
    assert "stale-while-revalidate" not in cache_control
