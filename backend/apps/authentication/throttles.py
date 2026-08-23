"""Límites específicos para acciones sensibles de autenticación."""

from rest_framework.throttling import UserRateThrottle


class ChangePasswordThrottle(UserRateThrottle):
    """Reduce intentos de adivinar la contraseña actual desde una sesión robada."""

    rate = "5/minute"
