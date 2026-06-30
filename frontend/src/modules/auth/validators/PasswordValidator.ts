/**
 * PasswordValidator — Chain of Responsibility node for password policy (FE).
 * Policy: ≥8 chars, at least one letter and one digit. SOLID: SRP·OCP·LSP.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

export class PasswordValidator extends BaseValidator {
  private static readonly MIN = 8

  validate(data: unknown): ValidationResult {
    const password = String((data as { password?: string })?.password ?? '')
    if (password.length < PasswordValidator.MIN) {
      return {
        isValid: false,
        errors: [`La contraseña debe tener al menos ${PasswordValidator.MIN} caracteres.`],
        field: 'password',
      }
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return {
        isValid: false,
        errors: ['La contraseña debe incluir al menos una letra y un número.'],
        field: 'password',
      }
    }
    return { isValid: true, errors: [], field: 'password' }
  }
}
