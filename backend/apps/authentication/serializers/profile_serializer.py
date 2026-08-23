"""ProfileUpdateSerializer — valida la edición del perfil propio (SRP: solo update).

El email y el rol NUNCA se editan por esta vía (el email es la identidad de la
cuenta; el rol solo lo gestiona un administrador).
"""

from rest_framework import serializers

from apps.authentication.models import User
from apps.authentication.validators import IdentificationValidator


class ProfileUpdateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150, required=False)
    apellido = serializers.CharField(max_length=150, required=False)
    tipo_identificacion = serializers.ChoiceField(
        choices=User.TipoIdentificacion.choices,
        required=False,
    )
    ruc = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        trim_whitespace=False,
    )
    empresa = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate(self, attrs: dict) -> dict:
        if not attrs:
            raise serializers.ValidationError("Debes enviar al menos un campo a actualizar.")
        user = self.context["user"]
        if user.role == User.Role.CLIENT and "empresa" in attrs and not attrs["empresa"].strip():
            raise serializers.ValidationError({"empresa": "La empresa es obligatoria."})
        if user.role == User.Role.CLIENT and (
            "tipo_identificacion" in attrs or "ruc" in attrs
        ):
            identification_data = {
                "tipo_identificacion": attrs.get(
                    "tipo_identificacion", user.tipo_identificacion
                ),
                "ruc": attrs.get("ruc", user.ruc),
            }
            result = IdentificationValidator().validate(identification_data)
            if not result.is_valid:
                raise serializers.ValidationError({result.field_name: result.errors[0]})
        return attrs
