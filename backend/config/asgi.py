"""
ASGI config for config project.

Routes HTTP through Django's standard application and WebSocket through Channels'
ProtocolTypeRouter → OriginValidator → URLRouter (realtime consumers).

OriginValidator (no AllowedHostsOriginValidator): el handshake WS llega directo
desde el navegador del frontend (Vercel no proxea WebSockets), así que su Origin
es el dominio del frontend — que no está ni debe estar en ALLOWED_HOSTS. La
lista permitida vive en settings.WS_ALLOWED_ORIGINS.

For more information, see:
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize the Django ASGI application early so the app registry is fully
# populated before we import anything that may touch models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import OriginValidator  # noqa: E402
from django.conf import settings  # noqa: E402

from config.websocket_urls import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": OriginValidator(
        URLRouter(websocket_urlpatterns),
        settings.WS_ALLOWED_ORIGINS,
    ),
})
