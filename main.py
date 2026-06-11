"""Punto de entrada del sistema de membresías."""

import sys

from gym_app.cli import run

if __name__ == "__main__":
    result = run()
    # -1 señala cancelación o entrada inválida (regla 9 del enunciado)
    sys.exit(0 if result > 0 else 1)