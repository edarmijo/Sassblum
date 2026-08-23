/**
 * NameValidator — Chain of Responsibility node for name presence (FE).
 * Extends BaseValidator (core). SOLID: SRP·OCP·LSP.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

export class NameValidator extends BaseValidator {
  validate(data: unknown): ValidationResult {
    const nombre = String((data as { nombre?: string })?.nombre ?? '').trim()
    if (!nombre) {
      return { isValid: false, errors: ['El nombre es obligatorio.'], field: 'nombre' }
    }
    return { isValid: true, errors: [], field: 'nombre' }
  }
}
