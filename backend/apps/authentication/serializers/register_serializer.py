"""RegisterSerializer — validates registration input (SRP)."""

from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150, allow_blank=False, trim_whitespace=True)
    apellido = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    email = serializers.EmailField()
    ruc = serializers.CharField(
        max_length=13,
        min_length=13,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )
    empresa = serializers.CharField(
        max_length=150,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs.get("password") != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Error: passwords no coinciden."}
            )
        return attrs
