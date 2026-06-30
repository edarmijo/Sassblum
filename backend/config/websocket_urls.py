"""
WebSocket URL routing (Django Channels).
Consumed by config/asgi.py via ProtocolTypeRouter → URLRouter.
"""

from django.urls import re_path

from apps.realtime.consumers import NotificationConsumer, TicketConsumer

websocket_urlpatterns = [
    re_path(r"^ws/notifications/$", NotificationConsumer.as_asgi()),
    re_path(r"^ws/tickets/(?P<ticket_id>\d+)/$", TicketConsumer.as_asgi()),
]
