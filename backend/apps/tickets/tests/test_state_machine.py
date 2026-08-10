"""
Tests for TicketStateMachine — covers all valid/invalid transitions and BR-35.
Run: pytest apps/tickets/tests/test_state_machine.py -v
"""

import pytest

from apps.tickets.state_machine import TicketStateMachine
from core.exceptions.domain_exceptions import CommentRequiredError, InvalidTransitionError


@pytest.fixture
def machine() -> TicketStateMachine:
    return TicketStateMachine()


# ── Valid transitions ──────────────────────────────────────────────────────────

class TestValidTransitions:
    def test_nuevo_to_en_proceso(self, machine):
        assert machine.transition("Nuevo", "EnProceso", "Asignado.") == "EnProceso"

    def test_en_proceso_to_en_espera(self, machine):
        assert machine.transition("EnProceso", "EnEspera", "Esperando respuesta.") == "EnEspera"

    def test_en_proceso_to_resuelto(self, machine):
        assert machine.transition("EnProceso", "Resuelto", "Problema resuelto.") == "Resuelto"

    def test_en_espera_to_en_proceso(self, machine):
        assert machine.transition("EnEspera", "EnProceso", "Cliente respondió.") == "EnProceso"

    def test_resuelto_to_cerrado(self, machine):
        assert machine.transition("Resuelto", "Cerrado", "Cliente confirmó.") == "Cerrado"

    @pytest.mark.parametrize("from_state", ["EnProceso", "EnEspera", "Resuelto", "Cerrado"])
    @pytest.mark.parametrize("to_state", ["EnProceso", "EnEspera", "Resuelto", "Cerrado"])
    def test_staff_can_move_freely_between_operational_states(
        self, machine, from_state, to_state
    ):
        assert machine.transition(from_state, to_state, "Actualización operativa.") == to_state


# ── Invalid transitions ────────────────────────────────────────────────────────

class TestInvalidTransitions:
    @pytest.mark.parametrize("from_state,to_state", [
        ("Nuevo",     "EnEspera"),
        ("Nuevo",     "Resuelto"),
        ("Nuevo",     "Cerrado"),
        ("EnProceso", "Nuevo"),
        ("EnEspera",  "Nuevo"),
        ("Resuelto",  "Nuevo"),
        ("Cerrado",   "Nuevo"),
    ])
    def test_invalid_transition_raises(self, machine, from_state, to_state):
        with pytest.raises(InvalidTransitionError) as exc_info:
            machine.transition(from_state, to_state, "Comentario válido.")
        assert exc_info.value.from_state == from_state
        assert exc_info.value.to_state == to_state

    def test_no_configured_state_is_terminal(self, machine):
        for state in ["Nuevo", "EnProceso", "EnEspera", "Resuelto", "Cerrado"]:
            assert machine.is_terminal(state) is False


# ── BR-35: comment required ────────────────────────────────────────────────────

class TestBR35CommentRequired:
    def test_empty_comment_raises(self, machine):
        with pytest.raises(CommentRequiredError):
            machine.transition("Nuevo", "EnProceso", "")

    def test_whitespace_only_comment_raises(self, machine):
        with pytest.raises(CommentRequiredError):
            machine.transition("Nuevo", "EnProceso", "   \t\n")

    def test_single_char_comment_passes(self, machine):
        assert machine.transition("Nuevo", "EnProceso", "X") == "EnProceso"


# ── Helper methods ─────────────────────────────────────────────────────────────

class TestHelperMethods:
    def test_can_transition_true(self, machine):
        assert machine.can_transition("Nuevo", "EnProceso") is True
        assert machine.can_transition("Resuelto", "Cerrado") is True

    def test_can_transition_false(self, machine):
        assert machine.can_transition("Cerrado", "Nuevo") is False
        assert machine.can_transition("Nuevo", "Cerrado") is False

    def test_closed_ticket_can_be_reopened(self, machine):
        assert machine.can_transition("Cerrado", "EnProceso") is True

    def test_all_states_returns_five(self, machine):
        states = TicketStateMachine.all_states()
        assert len(states) == 5
        assert set(states) == {"Nuevo", "EnProceso", "EnEspera", "Resuelto", "Cerrado"}

    def test_can_transition_unknown_state_is_false(self, machine):
        assert machine.can_transition("Desconocido", "Nuevo") is False
