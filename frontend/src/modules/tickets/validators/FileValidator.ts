/**
 * Chain of Responsibility node — validates file attachments on the ticket form.
 *
 * Responsibility (SRP): enforce only file size and MIME type rules.
 *     No text field checks, no API calls — just file constraints.
 * Depends on: BaseValidator (src/core/base/BaseValidator.ts).
 * Pattern: Chain of Responsibility node.
 * SOLID: SRP · OCP · LSP
 *
 * Rules enforced:
 *   - Each file: size ≤ 5 MB (5_242_880 bytes)
 *   - Each file: MIME type in ALLOWED_MIME_TYPES
 *
 * OCP: new MIME type allowed = add to ALLOWED_MIME_TYPES set; no logic change.
 *      New size policy = new node; this class unchanged.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

export class FileValidator extends BaseValidator {
  private static readonly MAX_SIZE_BYTES = 5_242_880 // 5 MB

  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ])

  validate(data: unknown): ValidationResult {
    const { adjuntos = [] } = data as { adjuntos?: File[] }
    for (const file of adjuntos) {
      if (file.size > FileValidator.MAX_SIZE_BYTES)
        return { isValid: false, field: 'adjuntos', errors: [`"${file.name}" supera el tamaño máximo de 5 MB.`] }
      if (!FileValidator.ALLOWED_MIME_TYPES.has(file.type))
        return { isValid: false, field: 'adjuntos', errors: [`"${file.name}" tiene un formato no permitido.`] }
    }
    return { isValid: true, field: '', errors: [] }
  }
}
