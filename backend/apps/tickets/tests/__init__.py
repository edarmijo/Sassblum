# Sprint 2 · Session 18 — Tests del módulo tickets (cobertura ≥ 80%):
#   test_state_machine.py   → todas las transiciones válidas e inválidas,
#                             CommentRequiredError (BR-35), estado Cerrado terminal
#   test_validators.py      → BasicFieldValidator, FileValidator, BusinessRuleValidator,
#                             cadena completa (todos los nodos en serie)
#   test_ticket_service.py  → create_ticket(), generate_ticket_number() formato T-YYYY-NNNN,
#                             permiso IsClient (worker/admin reciben 403)
