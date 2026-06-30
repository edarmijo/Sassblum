"""
Chain of Responsibility node — validates uploaded file attachments.

Responsibility (SRP): enforce only file size and MIME type rules.
Depends on: BaseValidator (core/base/base_validator.py).
Pattern: Chain of Responsibility node.
SOLID: SRP · OCP · LSP
"""

from __future__ import annotations

from core.base.base_validator import BaseValidator, ValidationResult


class FileValidator(BaseValidator):
    """Validates file size (≤5 MB) and MIME type for ticket attachments."""

    MAX_SIZE_BYTES: int = 5_242_880  # 5 MB

    ALLOWED_MIME_TYPES: frozenset[str] = frozenset({
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    })

    def validate(self, data: dict) -> ValidationResult:
        adjuntos = data.get("adjuntos", [])
        if not adjuntos:
            return ValidationResult(is_valid=True)

        for file in adjuntos:
            if file.size > self.MAX_SIZE_BYTES:
                return ValidationResult(
                    is_valid=False,
                    errors=[
                        f"'{file.name}' excede el límite de 5 MB "
                        f"({file.size / 1_048_576:.1f} MB)."
                    ],
                    field_name="adjuntos",
                )
            if file.content_type not in self.ALLOWED_MIME_TYPES:
                return ValidationResult(
                    is_valid=False,
                    errors=[
                        f"Tipo de archivo '{file.content_type}' no está permitido. "
                        f"Tipos aceptados: PDF, Word, imágenes y texto plano."
                    ],
                    field_name="adjuntos",
                )

        return ValidationResult(is_valid=True)
