/** Required company validation for client account forms. */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

export class EmpresaValidator extends BaseValidator {
  validate(data: unknown): ValidationResult {
    const empresa = String((data as { empresa?: string })?.empresa ?? '')
    if (!empresa.trim()) {
      return { isValid: false, errors: ['La empresa es obligatoria.'], field: 'empresa' }
    }
    return { isValid: true, errors: [], field: 'empresa' }
  }
}
