"""Cache policies shared by public, read-only API views."""

from __future__ import annotations

from django.utils.cache import patch_cache_control
from rest_framework.response import Response


def public_cache(response: Response) -> Response:
    """Store public responses only when caches revalidate them with the origin."""
    patch_cache_control(
        response,
        public=True,
        no_cache=True,
        must_revalidate=True,
    )
    return response
