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
    """_resolve_recipients selects and deduplicates users by event type."""

    def test_comment_includes_client_worker_and_active_admin(self):
        from apps.notifications.services import notification_service as mod

        cliente = make_user(5)
        worker = make_user(7)
        autor = make_user(9)

        fake_user_model = MagicMock()
        users = {5: cliente, 7: worker, 9: autor}
        fake_user_model.objects.get.side_effect = lambda id: users[id]
        fake_user_model.objects.filter.return_value = [autor]
        fake_user_model.Role.ADMIN = "admin"
        fake_user_model.Estado.ACTIVE = "activo"

        patched = {"apps.authentication.models": MagicMock(User=fake_user_model)}
        with patch.dict("sys.modules", patched):
            event = {
                "tipo_evento": "comentario",
                "cliente_id": 5,
                "asignado_id": 7,
                "autor_id": 9,
            }
            recipients = mod._resolve_recipients(event)

        assert {r.id for r in recipients} == {5, 7, 9}

    def test_status_change_includes_client_worker_and_active_admin(self):
        from apps.notifications.services import notification_service as mod

        cliente = make_user(5)
        worker = make_user(7)
        admin = make_user(9)

        fake_user_model = MagicMock()
        users = {5: cliente, 7: worker}
        fake_user_model.objects.get.side_effect = lambda id: users[id]
        fake_user_model.objects.filter.return_value = [admin]
        fake_user_model.Role.ADMIN = "admin"
        fake_user_model.Estado.ACTIVE = "activo"

        patched = {"apps.authentication.models": MagicMock(User=fake_user_model)}
        with patch.dict("sys.modules", patched):
            event = {
                "tipo_evento": "cambio_estado",
                "cliente_id": 5,
                "asignado_id": 7,
                "autor_id": 7,
            }
            recipients = mod._resolve_recipients(event)

        assert {r.id for r in recipients} == {5, 7, 9}

    def test_creacion_includes_client_author(self):
        """LN-3 (paridad legado): al crear su ticket, el cliente-autor SÍ recibe
        el email de confirmación con el número asignado."""
        from apps.notifications.services import notification_service as mod

        cliente = make_user(5)

        fake_user_model = MagicMock()
        fake_user_model.objects.get.side_effect = lambda id: {5: cliente}[id]
        fake_user_model.objects.filter.return_value = []
        fake_user_model.Role.ADMIN = "admin"
        fake_user_model.Estado.ACTIVE = "activo"

        patched = {"apps.authentication.models": MagicMock(User=fake_user_model)}
        with patch.dict("sys.modules", patched):
            event = {"tipo_evento": "creacion", "cliente_id": 5, "autor_id": 5}
            recipients = mod._resolve_recipients(event)

        assert 5 in {r.id for r in recipients}  # cliente-autor incluido en creacion

    def test_asignacion_includes_client_worker_and_admin_author(self):
        """Assignment notifies all three parties involved in the action."""
        from apps.notifications.services import notification_service as mod

        cliente = make_user(5)
        worker = make_user(7)
        admin = make_user(9)

        fake_user_model = MagicMock()
        users = {5: cliente, 7: worker, 9: admin}
        fake_user_model.objects.get.side_effect = lambda id: users[id]
        fake_user_model.objects.filter.return_value = []
        fake_user_model.Role.ADMIN = "admin"
        fake_user_model.Estado.ACTIVE = "activo"

        patched = {"apps.authentication.models": MagicMock(User=fake_user_model)}
        with patch.dict("sys.modules", patched):
            event = {
                "tipo_evento": "asignacion",
                "cliente_id": 5,
                "asignado_id": 7,
                "autor_id": 9,
            }
            recipients = mod._resolve_recipients(event)

        assert {r.id for r in recipients} == {5, 7, 9}

    def test_reasignacion_includes_previous_and_new_workers(self):
        """Reassignment informs every participant, including the displaced worker."""
        from apps.notifications.services import notification_service as mod

        cliente = make_user(5)
        previous_worker = make_user(6)
        new_worker = make_user(7)
        admin = make_user(9)

        fake_user_model = MagicMock()
        users = {5: cliente, 6: previous_worker, 7: new_worker, 9: admin}
        fake_user_model.objects.get.side_effect = lambda id: users[id]
        fake_user_model.objects.filter.return_value = []
        fake_user_model.Role.ADMIN = "admin"
        fake_user_model.Estado.ACTIVE = "activo"

        patched = {"apps.authentication.models": MagicMock(User=fake_user_model)}
        with patch.dict("sys.modules", patched):
            event = {
                "tipo_evento": "reasignacion",
                "cliente_id": 5,
                "asignado_anterior_id": 6,
                "asignado_id": 7,
                "autor_id": 9,
            }
            recipients = mod._resolve_recipients(event)

        assert {recipient.id for recipient in recipients} == {5, 6, 7, 9}
