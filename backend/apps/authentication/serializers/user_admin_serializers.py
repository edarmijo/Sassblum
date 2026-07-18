"""User admin serializers — one per operation (SRP). HU-14.

Nota de negocio (2026-07-17): se eliminó la restricción de dominio @sassblum.com
para trabajadores. La seguridad real es que SOLO el admin crea estas cuentas;
el correo corporativo queda como política operativa del equipo, no como regla
técnica (permite técnicos externos/temporales sin fricción).
"""

# pyrefly: ignore [missing-import]
from rest_framework import serializers


class UserCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["worker", "client"], default="worker")
