"""
Root ABC for all notification delivery channels.

Responsibility (SRP): declare the contract for sending a notification via one channel.
    No routing logic, no preference checks — just the delivery contract.
Depends on: abc.ABC — nothing from the domain.
Pattern: Strategy — each channel is a concrete strategy behind this interface.
SOLID: DIP · OCP · LSP · SRP

OCP extension:
    SMSStrategy / PushStrategy = new class implementing INotificationStrategy
    + one entry in NotificationFactory.CHANNEL_MAP.
    Existing strategies (Email, InApp, WebSocket) are NEVER modified.

LSP:
    NotificationService always receives INotificationStrategy — any concrete
    strategy is substitutable in tests (inject a mock without touching the service).

Sprint coverage:
    S19 → this file (contract) + 3 concrete strategies
    S20 → NotificationService.dispatch() consumes this interface
    S27 → tests mock INotificationStrategy; strategies tested in isolation
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class INotificationStrategy(ABC):
    """Abstract contract for a single notification delivery channel."""

    @abstractmethod
    def validate(self, recipient) -> bool:
        """
        Check that the channel can deliver to this recipient.
        Examples:
            EmailStrategy: recipient.email is non-empty and verified.
            WebSocketStrategy: the user's WS group exists (always True — fire-and-forget).
            InAppStrategy: recipient is active.

        Args:
            recipient: User model instance.

        Returns:
            bool — False means skip this channel for this recipient (no exception).
        """
        ...

    @abstractmethod
    def send(self, recipient, message: str, context: dict) -> None:
        """
        Deliver the notification to the recipient via this channel.

        Args:
            recipient: User model instance (the notification destination).
            message:   Plain-text summary of the notification.
            context:   Channel-specific data dict.
                       EmailStrategy expects: {'tipo', 'subject', 'titulo', 'cuerpo', ...}
                       InAppStrategy expects: {'tipo', 'titulo', 'cuerpo', 'payload'}
                       WebSocketStrategy expects: {'notification_id', 'tipo', 'titulo', 'cuerpo'}

        Raises:
            NotificationDeliveryError — if the channel fails after internal retries.
                NotificationService catches this and continues with other channels.
        """
        ...

    @abstractmethod
    def log(self, status: str, details: str) -> None:
        """
        Record the delivery attempt result.

        Args:
            status:  'sent' | 'failed' | 'skipped'
            details: Human-readable explanation (channel, recipient email/id, error message).
        """
        ...
