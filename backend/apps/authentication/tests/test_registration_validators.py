"""
Unit tests for NameValidator, EmpresaValidator, RucValidator, and RegistrationValidatorChain.
Run: pytest apps/authentication/tests/test_registration_validators.py -v
"""

import pytest

from apps.authentication.validators.name_validator import NameValidator
from apps.authentication.validators.empresa_validator import EmpresaValidator
from apps.authentication.validators.ruc_validator import RucValidator
from apps.authentication.validators.registration_validator_chain import RegistrationValidatorChain


class TestNameValidator:
    def test_valid_name_passes(self):
        v = NameValidator()
        result = v.validate({"nombre": "María José"})
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_empty_name_fails(self):
        v = NameValidator()
        result = v.validate({"nombre": ""})
        assert result.is_valid is False
        assert "El nombre es obligatorio." in result.errors
        assert result.field_name == "nombre"

    def test_whitespace_name_fails(self):
        v = NameValidator()
        result = v.validate({"nombre": "   "})
        assert result.is_valid is False
        assert "El nombre es obligatorio." in result.errors

    def test_missing_name_fails(self):
        v = NameValidator()
        result = v.validate({})
        assert result.is_valid is False
        assert result.field_name == "nombre"


class TestEmpresaValidator:
    def test_valid_empresa_passes(self):
        v = EmpresaValidator()
        result = v.validate({"empresa": "Tech Solutions S.A."})
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_empty_empresa_fails(self):
        v = EmpresaValidator()
        result = v.validate({"empresa": ""})
        assert result.is_valid is False
        assert "El nombre de la empresa es obligatorio." in result.errors
        assert result.field_name == "empresa"

    def test_whitespace_empresa_fails(self):
        v = EmpresaValidator()
        result = v.validate({"empresa": "   "})
        assert result.is_valid is False
        assert "El nombre de la empresa es obligatorio." in result.errors

    def test_missing_empresa_fails(self):
        v = EmpresaValidator()
        result = v.validate({})
        assert result.is_valid is False
        assert result.field_name == "empresa"


class TestRucValidator:
    def test_valid_ruc_passes(self):
        v = RucValidator()
        result = v.validate({"ruc": "0991234567001"})
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_empty_ruc_fails(self):
        v = RucValidator()
        result = v.validate({"ruc": ""})
        assert result.is_valid is False
        assert "El RUC es obligatorio." in result.errors
        assert result.field_name == "ruc"

    def test_missing_ruc_fails(self):
        v = RucValidator()
        result = v.validate({})
        assert result.is_valid is False
        assert "El RUC es obligatorio." in result.errors

    def test_ruc_with_non_digits_fails(self):
        v = RucValidator()
        result = v.validate({"ruc": "099123456700A"})
        assert result.is_valid is False
        assert "El RUC debe tener exactamente 13 dígitos numéricos." in result.errors
        assert result.field_name == "ruc"

    def test_ruc_too_short_fails(self):
        v = RucValidator()
        result = v.validate({"ruc": "099123456700"})  # 12 digits
        assert result.is_valid is False
        assert "El RUC debe tener exactamente 13 dígitos numéricos." in result.errors

    def test_ruc_too_long_fails(self):
        v = RucValidator()
        result = v.validate({"ruc": "09912345670011"})  # 14 digits
        assert result.is_valid is False
        assert "El RUC debe tener exactamente 13 dígitos numéricos." in result.errors


class TestRegistrationValidatorChain:
    def test_full_valid_data_passes(self):
        chain = RegistrationValidatorChain()
        result = chain.run({
            "nombre": "Carlos",
            "empresa": "SassBlum Inc.",
            "ruc": "0991234567001",
            "email": "carlos@example.com",
            "password": "Password123",
        })
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_chain_stops_at_invalid_name(self):
        chain = RegistrationValidatorChain()
        result = chain.run({
            "nombre": "",
            "empresa": "SassBlum Inc.",
            "ruc": "0991234567001",
            "email": "invalid-email",
            "password": "short",
        })
        assert result.is_valid is False
        assert result.field_name == "nombre"

    def test_chain_stops_at_invalid_empresa(self):
        chain = RegistrationValidatorChain()
        result = chain.run({
            "nombre": "Carlos",
            "empresa": "",
            "ruc": "0991234567001",
            "email": "invalid-email",
            "password": "short",
        })
        assert result.is_valid is False
        assert result.field_name == "empresa"

    def test_chain_stops_at_invalid_ruc(self):
        chain = RegistrationValidatorChain()
        result = chain.run({
            "nombre": "Carlos",
            "empresa": "SassBlum Inc.",
            "ruc": "123",
            "email": "invalid-email",
            "password": "short",
        })
        assert result.is_valid is False
        assert result.field_name == "ruc"

    def test_chain_stops_at_invalid_email(self):
        chain = RegistrationValidatorChain()
        result = chain.run({
            "nombre": "Carlos",
            "empresa": "SassBlum Inc.",
            "ruc": "0991234567001",
            "email": "invalid-email",
            "password": "short",
        })
        assert result.is_valid is False
        assert result.field_name == "email"

    def test_chain_stops_at_invalid_password(self):
        chain = RegistrationValidatorChain()
        result = chain.run({
            "nombre": "Carlos",
            "empresa": "SassBlum Inc.",
            "ruc": "0991234567001",
            "email": "carlos@example.com",
            "password": "short",
        })
        assert result.is_valid is False
        assert result.field_name == "password"
