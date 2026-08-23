"""Señales de dominio de autenticación para observadores desacoplados."""

from django.dispatch import Signal


# Emisor: AuthService después de cambiar la contraseña y revocar los JWT.
# Observador actual: realtime, que cierra conexiones WebSocket del usuario.
password_sessions_revoked = Signal()
