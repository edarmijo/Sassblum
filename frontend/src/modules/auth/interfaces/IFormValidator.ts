import type { ValidationResult } from '../../../core/base/BaseValidator'

/** Minimal validation contract consumed by authentication forms (ISP + DIP). */
export interface IFormValidator {
  run(data: unknown): ValidationResult
}
