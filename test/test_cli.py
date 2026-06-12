"""Tests del flujo CLI: confirmación, cancelación y reintento de selección.

Se simula la entrada del usuario con monkeypatch sobre input().
"""

from gym_app import cli


def _feed_inputs(monkeypatch, answers):
    iterator = iter(answers)
    monkeypatch.setattr("builtins.input", lambda _="": next(iterator))


class TestRunConfirmed:
    def test_basic_plan_confirmed_returns_total(self, monkeypatch):
        # plan basic, sin características, 1 miembro, confirma
        _feed_inputs(monkeypatch, ["basic", "", "1", "s"])
        assert cli.run() == 50

    def test_group_membership_confirmed(self, monkeypatch):
        # basic, sin características, 2 miembros → (50*2)*0.9 = 90
        _feed_inputs(monkeypatch, ["basic", "", "2", "s"])
        assert cli.run() == 90

    def test_features_parsed_from_comma_list(self, monkeypatch):
        # basic + personal_training + group_classes = 100
        _feed_inputs(monkeypatch, ["basic", "personal_training, group_classes", "1", "s"])
        assert cli.run() == 100


class TestRunCancelled:
    def test_user_cancels_returns_minus_one(self, monkeypatch):
        _feed_inputs(monkeypatch, ["basic", "", "1", "n"])
        assert cli.run() == -1

    def test_any_answer_other_than_s_cancels(self, monkeypatch):
        _feed_inputs(monkeypatch, ["basic", "", "1", "x"])
        assert cli.run() == -1


class TestRunRetriesOnInvalidInput:
    def test_invalid_plan_then_valid(self, monkeypatch):
        # 'diamante' no existe → reintenta con 'basic'
        _feed_inputs(monkeypatch, ["diamante", "basic", "", "1", "s"])
        assert cli.run() == 50

    def test_unavailable_plan_then_valid(self, monkeypatch):
        # 'student' no está disponible → reintenta
        _feed_inputs(monkeypatch, ["student", "basic", "", "1", "s"])
        assert cli.run() == 50

    def test_unavailable_feature_then_valid(self, monkeypatch):
        # 'spa_access' no disponible → reintenta sin características
        _feed_inputs(monkeypatch, ["basic", "spa_access", "", "1", "s"])
        assert cli.run() == 50

    def test_invalid_members_then_valid(self, monkeypatch):
        _feed_inputs(monkeypatch, ["basic", "", "cero", "0", "1", "s"])
        assert cli.run() == 50
