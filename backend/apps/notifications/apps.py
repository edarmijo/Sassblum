"""
NotificationsConfig — Django app config for the notifications module.

Responsibility (SRP): configure the app. No signal registration here —
    the Observer signal lives in apps.tickets.apps.ready() (the emitter side),
    keeping the dependency one-way (tickets → notifications, never the reverse).
"""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"
