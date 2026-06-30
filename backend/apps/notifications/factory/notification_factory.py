"""
Factory for assembling notification channel strategies (OCP).

Responsibility (SRP): map a channel type string to the correct INotificationStrategy instance.
    Does not send notifications; does not contain channel logic.
Depends on: INotificationStrategy — the only thing the factory exposes to consumers.
Pattern: Factory — decouples strategy creation from strategy consumption.
SOLID: OCP · SRP · DIP

OCP extension (Sprint 4 — SMSStrategy):
    1. Create apps/notifications/strategies/sms_strategy.py
    2. Add 'sms': SMSStrategy to CHANNEL_MAP
    3. Nothing else changes — NotificationService, EmailStrategy, InApp, WS untouched.

Usage:
    strategy = NotificationFactory.build('email', repo=notification_repo)
    strategy.send(recipient, message, context)
"""

from __future__ import annotations

from apps.notifications.interfaces import INotificationStrategy


class NotificationFactory:
    """Maps channel type → INotificationStrategy instance."""

    @staticmethod
    def build(channel_type: str, notification_repository=None) -> INotificationStrategy:
        """
        Return the strategy for the given channel type.

        Args:
            channel_type:            'email' | 'in_app' | 'ws'
            notification_repository: required only for 'in_app' (DIP injection).

        Returns:
            INotificationStrategy instance.

        Raises:
            ValueError — if channel_type is not registered in CHANNEL_MAP.
        """
        from apps.notifications.strategies import (
            EmailNotificationStrategy,
            InAppNotificationStrategy,
            WebSocketNotificationStrategy,
        )

        CHANNEL_MAP: dict[str, type] = {
            "email":  EmailNotificationStrategy,
            "in_app": InAppNotificationStrategy,
            "ws":     WebSocketNotificationStrategy,
        }

        strategy_class = CHANNEL_MAP.get(channel_type)
        if strategy_class is None:
            raise ValueError(
                f"Unknown notification channel: '{channel_type}'. "
                f"Registered channels: {list(CHANNEL_MAP.keys())}"
            )

        if channel_type == "in_app":
            if notification_repository is None:
                raise ValueError("'in_app' channel requires a notification_repository instance.")
            return strategy_class(notification_repository)

        return strategy_class()
