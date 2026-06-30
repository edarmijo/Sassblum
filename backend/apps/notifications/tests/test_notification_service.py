"""
Tests for NotificationService.dispatch() — recipient selection + preference gating.
Uses mocked recipients/strategies; no database required for the routing logic.
Run: pytest apps/notifications/tests/test_notification_service.py -v
"""

from unittest.mock import MagicMock, patch

from apps.notifications.services.notification_service import NotificationService


def make_user(uid, **prefs):
    u = MagicMock()
    u.id = uid
    u.is_authenticated = True
    u.estado = "activo"
    u.first_name = "X"
    return u


class TestDispatchPreferenceGating:
    def _run(self, prefs: dict, recipients: list):
        repo = MagicMock()
        service = NotificationService(repo)
        service.get_preferences = MagicMock(return_value=prefs)

        built = []

        def fake_build(channel, notification_repository=None):
            strat = MagicMock()
            strat.validate.return_value = True
            built.append(channel)
            return strat

        event = {"tipo_evento": "creacion", "ticket_numero": "T-2026-0001", "cliente_id": 5}
        with patch(
            "apps.notifications.services.notification_service._resolve_recipients",
            return_value=recipients,
        ), patch(
            "apps.notifications.factory.NotificationFactory.build",
            side_effect=fake_build,
        ):
            service.dispatch(event)
        return built

    def test_all_channels_used_when_all_enabled(self):
        prefs = {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [make_user(1)])
        assert set(built) == {"email", "in_app", "ws"}

    def test_email_skipped_when_disabled(self):
        prefs = {"email_activo": False, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [make_user(1)])
        assert "email" not in built
        assert set(built) == {"in_app", "ws"}

    def test_no_recipients_means_no_channels(self):
        prefs = {"email_activo": True, "in_app_activo": True, "ws_activo": True}
        built = self._run(prefs, [])
        assert built == []


class TestResolveRecipients:
    """_resolve_recipients excludes the author and selects by tipo_evento."""

    def test_author_excluded(self):
        from apps.notifications.services import notification_service as mod

        cliente = make_user(5)
        autor = make_user(9)

        fake_user_model = MagicMock()
        fake_user_model.objects.get.side_effect = lambda id: {5: cliente, 9: autor}[id]
        fake_user_model.objects.filter.return_value = []
        fake_user_model.Role.ADMIN = "admin"
        fake_user_model.Estado.ACTIVE = "activo"

        patched = {"apps.authentication.models": MagicMock(User=fake_user_model)}
        with patch.dict("sys.modules", patched):
            event = {"tipo_evento": "comentario", "cliente_id": 5, "autor_id": 9}
            recipients = mod._resolve_recipients(event)

        ids = {r.id for r in recipients}
        assert 9 not in ids  # author excluded
        assert 5 in ids
