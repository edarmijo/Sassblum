"""
ResetPasswordSerializer — validates the reset payload (SRP).

Checks the two passwords match and meet the minimum policy. The token itself is
validated by TokenService (not here — SRP: this serializer only validates input shape).
"""

from rest_framework import serializers


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Las contraseñas no coinciden."}
            )
        return attrs
