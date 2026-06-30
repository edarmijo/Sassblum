/**
 * Chain of Responsibility node — validates client-side business rules.
 *
 * Responsibility (SRP): enforce only UI-level business rules before submitting.
 *     No text field checks, no file checks — only pre-submit domain constraints.
 * Depends on: BaseValidator (src/core/base/BaseValidator.ts).
 * Pattern: Chain of Responsibility node.
 * SOLID: SRP · OCP · LSP
 *
 * Rules enforced (client-side mirror of BE BusinessRuleValidator):
 *   - Submission only within business hours (Mon–Fri 07:00–20:00, local time)
 *     Note: the authoritative check lives in the BE; this is UX-only early feedback.
 *
 * OCP: new client-side rule = new node; this class unchanged.
 *
 * Note: duplicate-ticket check is NOT done here (requires API call) — it lives in BE only.
 */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'

/**
 * H#6 (audit fix): Business hours validator is now informational only.
 * Tickets can be created 24/7. If outside business hours, the form shows
 * a non-blocking warning: "Tu ticket será atendido en el próximo horario laboral."
 * This validator always returns isValid: true — the warning is handled by the UI.
 */
export class BusinessRuleValidator extends BaseValidator {
  static isBusinessHours(): boolean {
    const now = new Date()
    const day = now.getDay()   // 0=Sun, 6=Sat
    const hour = now.getHours()
    return day !== 0 && day !== 6 && hour >= 7 && hour < 20
  }

  validate(_data: unknown): ValidationResult {
    // Always valid — business hours are informational, not blocking
    return { isValid: true, field: '', errors: [] }
  }
}
