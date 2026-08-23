"""Shared spreadsheet-cell hardening for Excel and CSV exports."""

from __future__ import annotations


_FORMULA_PREFIXES = ("=", "+", "-", "@")


def spreadsheet_safe_value(value: object) -> object:
    """Keep text literal when spreadsheet software could treat it as a formula."""
    if isinstance(value, str) and value.startswith(_FORMULA_PREFIXES):
        return f"'{value}"
    return value
