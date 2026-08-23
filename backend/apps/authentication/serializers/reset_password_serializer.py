"""
ResetPasswordSerializer — validates the reset payload (SRP).

Checks the two passwords match. The shared domain policy and token itself are
validated by TokenService (not here — SRP: this serializer only validates input shape).
"""

from __future__ import annotations

from rest_framework import serializers


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict[str, str]) -> dict[str, str]:
        if attrs["new_password"] != attrs["confirm_password"]:
            # La inconsistencia pertenece a la relación entre ambos campos,
            # por lo que DRF la representa correctamente como non_field_errors.
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        return attrs
