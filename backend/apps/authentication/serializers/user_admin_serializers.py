"""User admin serializers — one per operation (SRP). HU-14."""

# pyrefly: ignore [missing-import]
from rest_framework import serializers

# Trabajadores y administradores deben usar el dominio corporativo (seguridad).
STAFF_EMAIL_DOMAIN = "sassblum.com"


class UserCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["worker", "client"], default="worker")

    def validate(self, data):
        if data.get("role") == "worker":
            email = data.get("email", "")
            if not email.lower().endswith(f"@{STAFF_EMAIL_DOMAIN}"):
                raise serializers.ValidationError(
                    {"email": f"Los trabajadores deben usar un correo @{STAFF_EMAIL_DOMAIN}."}
                )
        return data
