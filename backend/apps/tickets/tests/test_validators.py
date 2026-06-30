"""
Tests for the ticket validator chain — each node in isolation + full chain.
Run: pytest apps/tickets/tests/test_validators.py -v
"""

import pytest
from unittest.mock import MagicMock

from apps.tickets.validators.basic_field_validator import BasicFieldValidator
from apps.tickets.validators.file_validator import FileValidator
from apps.tickets.validators.business_rule_validator import BusinessRuleValidator
from apps.tickets.validators import TicketValidatorChain


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_file(name: str, size: int, content_type: str):
    f = MagicMock()
    f.name = name
    f.size = size
    f.content_type = content_type
    return f


def make_repo(duplicate=None):
    repo = MagicMock()
    repo.find_active_duplicate.return_value = duplicate
    return repo


VALID_DATA = {
    "asunto": "Problema con la factura electrónica",
    "descripcion": "No puedo descargar la factura del mes de mayo de 2026.",
    "adjuntos": [],
    "cliente_id": 1,
    "servicio_id": 2,
}


# ── BasicFieldValidator ────────────────────────────────────────────────────────

class TestBasicFieldValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.v = BasicFieldValidator()

    def test_valid_data_passes(self):
        assert self.v.validate(VALID_DATA).is_valid

    def test_asunto_empty_fails(self):
        r = self.v.validate({**VALID_DATA, "asunto": ""})
        assert not r.is_valid and r.field_name == "asunto"

    def test_asunto_at_limit_passes(self):
        assert self.v.validate({**VALID_DATA, "asunto": "A" * 80}).is_valid

    def test_asunto_over_limit_fails(self):
        r = self.v.validate({**VALID_DATA, "asunto": "A" * 81})
        assert not r.is_valid and r.field_name == "asunto"

    def test_descripcion_too_short_fails(self):
        r = self.v.validate({**VALID_DATA, "descripcion": "Corto"})
        assert not r.is_valid and r.field_name == "descripcion"

    def test_descripcion_at_minimum_passes(self):
        assert self.v.validate({**VALID_DATA, "descripcion": "A" * 10}).is_valid


# ── FileValidator ──────────────────────────────────────────────────────────────

class TestFileValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.v = FileValidator()

    def test_no_files_passes(self):
        assert self.v.validate({"adjuntos": []}).is_valid

    def test_missing_adjuntos_key_passes(self):
        assert self.v.validate({}).is_valid

    def test_valid_pdf_passes(self):
        f = make_file("doc.pdf", 1_000_000, "application/pdf")
        assert self.v.validate({"adjuntos": [f]}).is_valid

    def test_valid_image_passes(self):
        f = make_file("foto.jpg", 500_000, "image/jpeg")
        assert self.v.validate({"adjuntos": [f]}).is_valid

    def test_file_too_large_fails(self):
        f = make_file("grande.pdf", 6_000_000, "application/pdf")
        r = self.v.validate({"adjuntos": [f]})
        assert not r.is_valid and r.field_name == "adjuntos"

    def test_invalid_mime_fails(self):
        f = make_file("script.exe", 1000, "application/x-msdownload")
        r = self.v.validate({"adjuntos": [f]})
        assert not r.is_valid and r.field_name == "adjuntos"

    def test_first_invalid_file_stops_iteration(self):
        good = make_file("ok.pdf", 100, "application/pdf")
        bad = make_file("big.pdf", 6_000_000, "application/pdf")
        r = self.v.validate({"adjuntos": [bad, good]})
        assert not r.is_valid


# ── BusinessRuleValidator ──────────────────────────────────────────────────────

class TestBusinessRuleValidator:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.repo = make_repo()
        self.v = BusinessRuleValidator(self.repo)

    # Nota: la regla de horario laboral es informativa y se maneja en la capa de
    # vista (los tickets se crean 24/7). Este validador solo bloquea duplicados.

    def test_no_duplicate_passes(self):
        assert self.v.validate(VALID_DATA).is_valid

    def test_duplicate_ticket_fails(self):
        self.repo.find_active_duplicate.return_value = object()  # truthy = duplicate exists
        r = self.v.validate(VALID_DATA)
        assert not r.is_valid and r.field_name == "duplicado"


# ── Full chain via TicketValidatorChain ────────────────────────────────────────

class TestTicketValidatorChain:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.repo = make_repo()
        self.chain = TicketValidatorChain(self.repo)

    def test_invalid_asunto_stops_chain_does_not_call_repo(self):
        data = {**VALID_DATA, "asunto": ""}
        r = self.chain.run(data)
        assert not r.is_valid
        assert r.field_name == "asunto"
        self.repo.find_active_duplicate.assert_not_called()

    def test_invalid_file_stops_before_business_rule(self):
        bad_file = make_file("big.pdf", 6_000_000, "application/pdf")
        data = {**VALID_DATA, "adjuntos": [bad_file]}
        r = self.chain.run(data)
        assert not r.is_valid
        assert r.field_name == "adjuntos"
        self.repo.find_active_duplicate.assert_not_called()
