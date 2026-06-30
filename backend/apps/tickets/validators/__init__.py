from .ticket_validator_chain import TicketValidatorChain

__all__ = ["TicketValidatorChain"]

# Nodos de la cadena (creados en S13 — solo firmas):
#   basic_field_validator.py    → BasicFieldValidator(BaseValidator) — asunto ≤80, descripcion ≥10
#   file_validator.py           → FileValidator(BaseValidator) — tamaño ≤5MB, mime permitido
#   business_rule_validator.py  → BusinessRuleValidator(BaseValidator)
#                                  horario laboral, duplicados activos
#   ticket_validator_chain.py   → TicketValidatorChain — fachada que delega
#                                  la construcción a ValidatorFactory
#
# OCP: Sprint 4 → CriticalPriorityValidator se agrega en ValidatorFactory;
#      los nodos existentes quedan intactos.
