"""Payload del cambio de contraseña con una sesión autenticada."""

from __future__ import annotations

from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):
    """Valida forma y confirmación; la política de dominio vive en el servicio."""

    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict[str, str]) -> dict[str, str]:
        if attrs["new_password"] != attrs["confirm_password"]:
            # La inconsistencia pertenece a la relación entre ambos campos,
            # por lo que DRF la representa correctamente como non_field_errors.
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        return attrs
