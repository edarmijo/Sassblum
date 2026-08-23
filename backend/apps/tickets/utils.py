"""Pure helpers shared by ticket services and management commands."""

from __future__ import annotations

from typing import Protocol


SYSTEM_EVENT_AUTHOR_NAME = "Sistema (migración histórica)"


class EventAuthor(Protocol):
    """Minimum author shape required to build an immutable display snapshot."""

    first_name: str
    last_name: str
    email: str


def event_author_name(author: EventAuthor | None) -> str:
    """Return the name that must be frozen when a ticket event is created."""
    if author is None:
        return SYSTEM_EVENT_AUTHOR_NAME
    return f"{author.first_name} {author.last_name}".strip() or author.email
