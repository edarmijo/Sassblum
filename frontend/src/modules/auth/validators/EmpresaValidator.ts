/**
 * EmpresaValidator — Chain of Responsibility node for company name presence (FE).
 * Extends BaseValidator (core). SOLID: SRP·OCP·LSP.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

export class EmpresaValidator extends BaseValidator {
  validate(data: unknown): ValidationResult {
    const empresa = String((data as { empresa?: string })?.empresa ?? '').trim()
    if (!empresa) {
      return {
        isValid: false,
        errors: ['El nombre de la empresa es obligatorio.'],
        field: 'empresa',
      }
    }
    return { isValid: true, errors: [], field: 'empresa' }
  }
}
