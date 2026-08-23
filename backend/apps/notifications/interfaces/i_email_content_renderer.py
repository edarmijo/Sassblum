"""Contracts for rendering equivalent plain-text and HTML email content."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Mapping


@dataclass(frozen=True)
class RenderedEmailContent:
    """Both MIME representations of one transactional email."""

    text: str
    html: str


class IEmailContentRenderer(ABC):
    """Render the two equivalent representations used by email transports."""

    @abstractmethod
    def render(
        self,
        html_template_name: str,
        context: Mapping[str, object],
    ) -> RenderedEmailContent:
        """Return text and HTML with the same wording and operational data."""
        ...
