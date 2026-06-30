/**
 * Abstract base node for the Chain of Responsibility pattern used across all
 * validation layers: auth forms (Sprint 1), ticket creation (Sprint 2),
 * report filters (Sprint 4).
 *
 * Responsibility (SRP): define the node structure and chain traversal.
 *   Each concrete subclass implements exactly ONE validation rule in validate().
 * Depends on: nothing — this is a pure structural abstraction.
 * Pattern: Chain of Responsibility
 * SOLID: OCP · SRP (one rule per node) · LSP (every node is substitutable)
 *
 * How to extend (OCP):
 *   1. Create PhoneValidator extends BaseValidator
 *   2. Implement validate() with only the phone rule
 *   3. Add to chain: email.addValidator(password).addValidator(phone)
 *   → EmailValidator and PasswordValidator are NEVER modified.
 */

export interface ValidationResult {
  /** Whether this node's rule passed */
  isValid: boolean
  /** User-facing error messages suitable for inline form display */
  errors: string[]
  /** The form field that failed (e.g. 'email', 'password', 'phone') */
  field: string
}

export abstract class BaseValidator {
  private _next: BaseValidator | null = null

  /**
   * Appends a validator node at the end of this chain.
   * Returns the added node to allow fluent chaining:
   *   email.addValidator(password).addValidator(phone)
   */
  addValidator(validator: BaseValidator): BaseValidator {
    this._next = validator
    return validator
  }

  /**
   * Implement exactly ONE validation rule here.
   * Must NOT reference this._next — chain traversal is the responsibility of run().
   * Violation of this rule breaks SRP and makes the chain unpredictable.
   *
   * @param data - The raw form data object to inspect
   */
  abstract validate(data: unknown): ValidationResult

  /**
   * Runs the full chain starting at this node.
   * Stops and returns immediately on the first failure without running subsequent nodes.
   * Do NOT override this in concrete subclasses (LSP).
   */
  run(data: unknown): ValidationResult {
    const result = this.validate(data)
    if (!result.isValid || !this._next) return result
    return this._next.run(data)
  }
}
