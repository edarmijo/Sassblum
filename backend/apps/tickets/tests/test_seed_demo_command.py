"""Safety tests for the destructive demo-data management command."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings

from apps.tickets.management.commands.seed_demo import Command


def test_seed_demo_requires_explicit_confirmation() -> None:
    with pytest.raises(CommandError, match="--confirm-demo"):
        call_command("seed_demo")


@override_settings(DEBUG=False)
def test_seed_demo_rejects_non_debug_without_second_guard(monkeypatch) -> None:
    monkeypatch.delenv("ALLOW_DEMO_SEED", raising=False)
    with pytest.raises(CommandError, match="DEBUG=False"):
        call_command("seed_demo", confirm_demo=True)


@override_settings(DEBUG=True)
def test_seed_demo_runs_only_after_confirmation() -> None:
    with patch.object(Command, "_seed") as seed:
        call_command("seed_demo", confirm_demo=True)
    seed.assert_called_once_with()
