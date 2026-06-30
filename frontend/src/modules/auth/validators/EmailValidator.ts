/**
 * EmailValidator — Chain of Responsibility node for email format (FE).
 * Extends BaseValidator (core). SOLID: SRP·OCP·LSP.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export class EmailValidator extends BaseValidator {
  validate(data: unknown): ValidationResult {
    const email = String((data as { email?: string })?.email ?? '').trim()
    if (!EMAIL_RE.test(email)) {
      return { isValid: false, errors: ['El correo no tiene un formato válido.'], field: 'email' }
    }
    return { isValid: true, errors: [], field: 'email' }
  }
}
