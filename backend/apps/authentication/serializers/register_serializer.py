"""RegisterSerializer — validates registration input (SRP)."""

from rest_framework import serializers

from apps.authentication.models import User
from apps.authentication.validators import IdentificationValidator


class RegisterSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    tipo_identificacion = serializers.ChoiceField(
        choices=User.TipoIdentificacion.choices,
        default=User.TipoIdentificacion.RUC,
    )
    ruc = serializers.CharField(
        max_length=20,
        required=True,
        allow_blank=False,
        trim_whitespace=False,
    )
    empresa = serializers.CharField(max_length=150, required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs: dict) -> dict:
        if attrs.get("password") != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Error: passwords no coinciden."}
            )
        result = IdentificationValidator().validate(attrs)
        if not result.is_valid:
            raise serializers.ValidationError({result.field_name: result.errors[0]})
        return attrs
