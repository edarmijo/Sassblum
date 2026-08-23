"""User admin serializers — one per operation (SRP). HU-14 / B10."""

# pyrefly: ignore [missing-import]
from django.conf import settings
from rest_framework import serializers

from apps.authentication.validators import WorkerEmailDomainValidator


class UserCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["worker", "client"], default="worker")

    def validate(self, attrs: dict) -> dict:
        result = WorkerEmailDomainValidator(
            settings.WORKER_EMAIL_DOMAIN
        ).validate(attrs)
        if not result.is_valid:
            raise serializers.ValidationError({result.field_name: result.errors})
        return attrs


class UserUpdateSerializer(serializers.Serializer):
    """Accept only administrative corrections to first and last name."""

    nombre = serializers.CharField(max_length=150, required=False, allow_blank=False)
    apellido = serializers.CharField(max_length=150, required=False, allow_blank=False)

    def validate(self, attrs: dict) -> dict:
        protected = {"email", "role", "rol", "password"}.intersection(
            self.initial_data
        )
        if protected:
            raise serializers.ValidationError({
                field: "Este campo no puede modificarse desde esta operación."
                for field in sorted(protected)
            })
        if not attrs:
            raise serializers.ValidationError(
                "Debes enviar al menos el nombre o el apellido."
            )
        return attrs
