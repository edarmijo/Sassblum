"""Unit tests for the injected B3 ticket profile policy."""

from apps.authentication.validators import EmpresaValidator, IdentificationValidator
from apps.tickets.validators.profile_completeness_validator import (
    ProfileCompletenessValidator,
)


def build_validator() -> ProfileCompletenessValidator:
    return ProfileCompletenessValidator((
        IdentificationValidator(),
        EmpresaValidator(),
    ))


def test_profile_completeness_accepts_valid_cedula_and_company() -> None:
    result = build_validator().validate({
        "tipo_identificacion": "Cedula",
        "ruc": "0912345678",
        "empresa": "Empresa Cliente",
    })
    assert result.is_valid


def test_profile_completeness_returns_one_profile_level_error() -> None:
    result = build_validator().validate({
        "tipo_identificacion": "RUC",
        "ruc": "",
        "empresa": "",
    })
    assert not result.is_valid
    assert result.field_name == "perfil"
    assert result.errors == [ProfileCompletenessValidator.MESSAGE]
