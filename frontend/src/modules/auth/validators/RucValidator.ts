/**
 * RucValidator — Chain of Responsibility node for RUC validation (FE).
 * Policy: exactly 13 numeric digits (Ecuadorian RUC).
 * Extends BaseValidator (core). SOLID: SRP·OCP·LSP.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

const RUC_RE = /^\d{13}$/

export class RucValidator extends BaseValidator {
  validate(data: unknown): ValidationResult {
    const ruc = String((data as { ruc?: string })?.ruc ?? '').trim()
    if (!ruc) {
      return { isValid: false, errors: ['El RUC es obligatorio.'], field: 'ruc' }
    }
    if (!RUC_RE.test(ruc)) {
      return {
        isValid: false,
        errors: ['El RUC debe tener exactamente 13 dígitos numéricos.'],
        field: 'ruc',
      }
    }
    return { isValid: true, errors: [], field: 'ruc' }
  }
}
