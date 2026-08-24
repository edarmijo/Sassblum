"""Django template renderer for equivalent plain-text and HTML emails."""

from __future__ import annotations

from typing import Mapping

from django.template.loader import render_to_string

from apps.notifications.interfaces import IEmailContentRenderer, RenderedEmailContent


class TemplateEmailContentRenderer(IEmailContentRenderer):
    """Render paired templates while keeping template selection out of strategies."""

    def render(
        self,
        html_template_name: str,
        context: Mapping[str, object],
    ) -> RenderedEmailContent:
        if not html_template_name.endswith(".html"):
            raise ValueError("La plantilla HTML debe terminar en .html.")
        basename = html_template_name.removesuffix(".html").removeprefix("email/")
        text_template_name = f"email/text/{basename}.txt"
        return RenderedEmailContent(
            text=render_to_string(text_template_name, context).strip(),
            html=render_to_string(html_template_name, context),
        )
