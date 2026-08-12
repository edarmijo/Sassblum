"""Cache policies shared by public, read-only API views."""

from __future__ import annotations

from django.utils.cache import patch_cache_control
from rest_framework.response import Response


def public_cache(response: Response, *, max_age: int = 60) -> Response:
    """Allow short browser caching and longer stale CDN revalidation."""
    patch_cache_control(
        response,
        public=True,
        max_age=max_age,
        s_maxage=300,
        stale_while_revalidate=86_400,
    )
    return response
