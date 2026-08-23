"""Generación criptográfica de credenciales temporales mostradas una sola vez."""

from __future__ import annotations

import secrets


def generate_temporary_credential() -> str:
    """Devuelve una credencial fuerte que satisface la política común del proyecto."""
    return f"Aa1!{secrets.token_urlsafe(18)}"
