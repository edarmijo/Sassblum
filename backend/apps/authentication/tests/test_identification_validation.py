"""B3 identification contract tests shared by registration and profile."""

import pytest

from apps.authentication.models import User
from apps.authentication.serializers import RegisterSerializer
from apps.authentication.validators import IdentificationValidator


@pytest.mark.parametrize(
    ("identification_type", "value"),
    [
        (User.TipoIdentificacion.RUC, "0991234567001"),
        (User.TipoIdentificacion.CEDULA, "0912345678"),
    ],
)
def test_identification_validator_accepts_exact_ascii_digits(
    identification_type: str, value: str
) -> None:
    result = IdentificationValidator().validate({
        "tipo_identificacion": identification_type,
        "ruc": value,
    })
    assert result.is_valid


@pytest.mark.parametrize(
    ("identification_type", "value"),
    [
        (User.TipoIdentificacion.RUC, "099123456700"),
        (User.TipoIdentificacion.RUC, "09912345670012"),
        (User.TipoIdentificacion.RUC, "099123-567001"),
        (User.TipoIdentificacion.RUC, "099123 567001"),
        (User.TipoIdentificacion.RUC, "099123456700A"),
        (User.TipoIdentificacion.RUC, " 0991234567001"),
        (User.TipoIdentificacion.CEDULA, "091234567"),
        (User.TipoIdentificacion.CEDULA, "09123456789"),
        (User.TipoIdentificacion.CEDULA, "09123-5678"),
        (User.TipoIdentificacion.CEDULA, "09123 5678"),
        (User.TipoIdentificacion.CEDULA, "091234567A"),
    ],
)
def test_identification_validator_rejects_format_and_length_variants(
    identification_type: str, value: str
) -> None:
    result = IdentificationValidator().validate({
        "tipo_identificacion": identification_type,
        "ruc": value,
    })
    assert not result.is_valid
    assert result.field_name == "ruc"


def test_registration_requires_company_and_identification() -> None:
    serializer = RegisterSerializer(data={
        "nombre": "Ana",
        "apellido": "Pérez",
        "email": "ana@example.com",
        "password": "Clave1234",
        "confirm_password": "Clave1234",
    })
    assert not serializer.is_valid()
    assert {"ruc", "empresa"} <= set(serializer.errors)


def test_registration_defaults_identification_type_to_ruc() -> None:
    serializer = RegisterSerializer(data={
        "nombre": "Ana",
        "apellido": "Pérez",
        "email": "ana@example.com",
        "ruc": "0991234567001",
        "empresa": "Empresa",
        "password": "Clave1234",
        "confirm_password": "Clave1234",
    })
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["tipo_identificacion"] == User.TipoIdentificacion.RUC
