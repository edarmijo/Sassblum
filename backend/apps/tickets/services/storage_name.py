"""Utilities for portable, safe object names in cloud storage."""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path
from uuid import uuid4


def storage_filename(filename: str) -> str:
    """Return an ASCII object name accepted consistently by Supabase Storage."""
    name = Path(filename).name
    stem, suffix = Path(name).stem, Path(name).suffix
    normalized_stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", normalized_stem).strip(".-") or "archivo"
    safe_suffix = re.sub(r"[^A-Za-z0-9.]", "", suffix.lower())
    return f"{safe_stem}{safe_suffix}"


def versioned_storage_filename(filename: str) -> str:
    """Return a safe object name whose URL changes for every uploaded version."""
    safe_name = Path(storage_filename(filename))
    return f"{safe_name.stem}-{uuid4().hex[:12]}{safe_name.suffix}"
