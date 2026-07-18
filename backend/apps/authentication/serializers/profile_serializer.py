"""ProfileUpdateSerializer — valida la edición del perfil propio (SRP: solo update).

El email y el rol NUNCA se editan por esta vía (el email es la identidad de la
cuenta; el rol solo lo gestiona un administrador).
"""

from rest_framework import serializers


class ProfileUpdateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150, required=False)
    apellido = serializers.CharField(max_length=150, required=False)
    ruc = serializers.CharField(max_length=13, required=False, allow_blank=True)
    empresa = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Debes enviar al menos un campo a actualizar.")
        return attrs
