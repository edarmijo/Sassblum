/**
 * Façade over the ticket creation validator chain built by ValidatorFactory.
 *
 * Responsibility (SRP): expose a single run(data) entry point.
 *     Does not know which nodes exist or in what order — ValidatorFactory decides.
 * Depends on: ValidatorFactory (src/core/factories/ValidatorFactory.ts) — DIP.
 * Pattern: Chain of Responsibility (façade) + Factory (delegates construction).
 * SOLID: SRP · DIP · OCP
 *
 * OCP: adding nodes in Sprint 4 = one line in ValidatorFactory; this class unchanged.
 *
 * Usage in CreateTicketForm:
 *   const chain = new TicketValidatorChain()
 *   const result = chain.run(formData)
 *   if (!result.isValid) showError(result.errors)
 */

import { ValidatorFactory } from '../../../core/factories/ValidatorFactory'
import type { BaseValidator, ValidationResult } from '../../../core/base/BaseValidator'

export class TicketValidatorChain {
  private readonly root: BaseValidator

  constructor() {
    this.root = ValidatorFactory.buildTicketChain()
  }

  run(data: unknown): ValidationResult {
    return this.root.run(data)
  }
}
