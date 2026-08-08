"""Utilities for portable, safe object names in cloud storage."""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path


def storage_filename(filename: str) -> str:
    """Return an ASCII object name accepted consistently by Supabase Storage."""
    name = Path(filename).name
    stem, suffix = Path(name).stem, Path(name).suffix
    normalized_stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", normalized_stem).strip(".-") or "archivo"
    safe_suffix = re.sub(r"[^A-Za-z0-9.]", "", suffix.lower())
    return f"{safe_stem}{safe_suffix}"
