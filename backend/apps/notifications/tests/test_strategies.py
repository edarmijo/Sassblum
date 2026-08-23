"""
Tests for the three notification strategies in isolation (mocked I/O).
These do NOT require a database — they mock send_mail, the repository, and the channel layer.
Run: pytest apps/notifications/tests/test_strategies.py -v
"""

from unittest.mock import MagicMock, patch

import pytest

from apps.notifications.strategies.email_strategy import EmailNotificationStrategy
from apps.notifications.strategies.in_app_strategy import InAppNotificationStrategy
from apps.notifications.strategies.websocket_strategy import WebSocketNotificationStrategy


def make_user(**overrides):
    user = MagicMock()
    user.id = overrides.get("id", 1)
    user.is_authenticated = True
    user.email = overrides.get("email", "user@example.com")
    user.email_verificado = overrides.get("email_verificado", True)
    user.estado = overrides.get("estado", "activo")
    user.first_name = "Ana"
    return user


# ── EmailNotificationStrategy ──────────────────────────────────────────────────

class TestEmailStrategy:
    def test_validate_true_for_active_verified_user(self):
        assert EmailNotificationStrategy().validate(make_user()) is True

    def test_validate_false_when_email_not_verified(self):
        assert EmailNotificationStrategy().validate(make_user(email_verificado=False)) is False

    def test_validate_false_when_blocked(self):
        assert EmailNotificationStrategy().validate(make_user(estado="bloqueado")) is False

    @patch("apps.notifications.strategies.email_strategy.render_to_string", return_value="<p>x</p>")
    @patch("apps.notifications.strategies.email_strategy.EmailMultiAlternatives")
    def test_send_builds_email_with_recipient_and_html(self, mock_email_cls, _mock_render):
        strat = EmailNotificationStrategy()
        strat.send(
            make_user(email="dest@x.com"),
            "msg",
            {"tipo": "creacion", "ticket_numero": "T-2026-0001"},
        )
        mock_email_cls.assert_called_once()
        kwargs = mock_email_cls.call_args.kwargs
        assert kwargs["to"] == ["dest@x.com"]
        assert kwargs["subject"] == "[SassBlum] Nuevo ticket creado · T-2026-0001"
        mock_email_cls.return_value.attach_alternative.assert_called_once_with(
            "<p>x</p>", "text/html"
        )
        mock_email_cls.return_value.send.assert_called_once_with(fail_silently=False)

    @patch("apps.notifications.strategies.email_strategy.render_to_string", return_value="<p>x</p>")
    @patch("apps.notifications.strategies.email_strategy.EmailMultiAlternatives")
    def test_send_applies_cc_from_settings(self, mock_email_cls, _mock_render, settings):
        """LN-3/LN-4: copia al equipo (paridad con el CC del sistema legado)."""
        settings.EMAIL_CC = ["notificaciones@sassblum.com"]
        recipient = make_user(id=5)
        context = {
            "tipo": "creacion",
            "cliente_id": 5,
            "cliente_email": "contacto@example.com",
        }
        EmailNotificationStrategy().send(recipient, "msg", context)
        assert mock_email_cls.call_args.kwargs["cc"] == ["notificaciones@sassblum.com"]

    @patch("apps.notifications.strategies.email_strategy.render_to_string", return_value="<p>x</p>")
    @patch("apps.notifications.strategies.email_strategy.EmailMultiAlternatives")
    def test_client_delivery_uses_ticket_contact_and_reply_to(
        self, mock_email_cls, mock_render, settings
    ):
        settings.EMAIL_REPLY_TO = ["soporte@sassblum.com"]
        recipient = make_user(id=5, email="cuenta@example.com")
        context = {
            "tipo": "comentario",
            "cliente_id": 5,
            "cliente_email": "contacto-corregido@example.com",
            "cliente_nombre": "Contacto Corregido",
            "recipient_nombre": "Nombre de la cuenta",
        }

        EmailNotificationStrategy().send(recipient, "msg", context)

        kwargs = mock_email_cls.call_args.kwargs
        assert kwargs["to"] == ["contacto-corregido@example.com"]
        assert kwargs["reply_to"] == ["soporte@sassblum.com"]
        assert mock_render.call_args.args[1]["is_ticket_client"] is True
        assert mock_render.call_args.args[1]["recipient_nombre"] == "Contacto Corregido"

    @pytest.mark.parametrize("notification_type", ["password_reset", "email_verification"])
    @patch("apps.notifications.strategies.email_strategy.render_to_string", return_value="<p>x</p>")
    @patch("apps.notifications.strategies.email_strategy.EmailMultiAlternatives")
    def test_auth_email_never_uses_ticket_cc_or_reply_to(
        self, mock_email_cls, _mock_render, settings, notification_type
    ):
        settings.EMAIL_CC = ["notificaciones@sassblum.com"]
        settings.EMAIL_REPLY_TO = ["soporte@sassblum.com"]

        EmailNotificationStrategy().send(make_user(), "msg", {"tipo": notification_type})

        kwargs = mock_email_cls.call_args.kwargs
        assert kwargs["cc"] is None
        assert kwargs["reply_to"] is None

    @patch("apps.notifications.strategies.email_strategy.render_to_string")
    @patch("apps.notifications.strategies.email_strategy.EmailMultiAlternatives")
    def test_client_delivery_without_effective_contact_is_skipped(
        self, mock_email_cls, mock_render
    ):
        recipient = make_user(id=5, email="cuenta@example.com")
        context = {"tipo": "creacion", "cliente_id": 5, "cliente_email": ""}

        EmailNotificationStrategy().send(recipient, "msg", context)

        mock_email_cls.assert_not_called()
        mock_render.assert_not_called()


# ── InAppNotificationStrategy ──────────────────────────────────────────────────

class TestInAppStrategy:
    def test_send_persists_via_repository(self):
        repo = MagicMock()
        strat = InAppNotificationStrategy(repo)
        user = make_user()
        strat.send(user, "msg", {"tipo": "comentario", "titulo": "T", "cuerpo": "C"})
        repo.create.assert_called_once()
        data = repo.create.call_args.args[0]
        assert data["usuario"] is user
        assert data["tipo"] == "comentario"
        assert data["leida"] is False

    def test_validate_false_when_blocked(self):
        strategy = InAppNotificationStrategy(MagicMock())
        assert strategy.validate(make_user(estado="bloqueado")) is False


# ── WebSocketNotificationStrategy ──────────────────────────────────────────────

class TestWebSocketStrategy:
    @patch("apps.notifications.strategies.websocket_strategy.async_to_sync")
    @patch("apps.notifications.strategies.websocket_strategy.get_channel_layer")
    def test_send_group_send_to_user_group(self, mock_layer, mock_ats):
        mock_layer.return_value = MagicMock()
        sender = MagicMock()
        mock_ats.return_value = sender

        strat = WebSocketNotificationStrategy()
        strat.send(make_user(id=42), "msg", {"tipo": "creacion", "titulo": "T", "cuerpo": "C"})

        # async_to_sync(group_send) was invoked with the user group
        sender.assert_called_once()
        group_arg = sender.call_args.args[0]
        assert group_arg == "notif_user_42"
        message = sender.call_args.args[1]
        assert message["type"] == "notification.new"
