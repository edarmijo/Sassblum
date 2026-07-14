"""
Utilidades compartidas para tests — sin credenciales hardcodeadas (S2068).
"""

import secrets


def random_credential() -> str:
    """Credencial aleatoria por corrida de tests.

    El marcador inicial garantiza la política de contraseñas de forma
    determinista (mayúscula, minúscula, dígito y símbolo); el resto viene
    de `secrets`, así que ningún valor queda hardcodeado en el código.
    """
    marker = "Aa1!"
    return marker + secrets.token_urlsafe(12)
