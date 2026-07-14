"""
Run-scoped credentials shared by the acceptance suite.

Generadas con `secrets` al importar: deterministas dentro de una corrida de
pytest (fixtures y tests ven el mismo valor) pero nunca hardcodeadas (S2068).
"""

import secrets


def _random_credential() -> str:
    """El marcador inicial cumple la política (mayúscula/minúscula/dígito/símbolo)."""
    marker = "Aa1!"
    return marker + secrets.token_urlsafe(12)


# Password every conftest fixture user is created with.
TEST_PASSWORD = _random_credential()

# Password used when a test registers a brand-new account.
NEW_USER_PASSWORD = _random_credential()

# Guaranteed-wrong password for negative login tests (distinta de las demás).
WRONG_PASSWORD = _random_credential()

# Classic SQL-injection payload (attack input, not a credential).
SQLI_PAYLOAD = "' OR 1=1 --"
