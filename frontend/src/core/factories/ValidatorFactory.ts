/**
 * Factory for assembling validator chains — centralises node wiring (OCP).
 *
 * Responsibility (SRP): know which validator nodes exist and in what order.
 *     Does not validate anything; does not contain business rules.
 * Depends on: concrete validator classes in modules/tickets/validators/.
 *     This is the ONE place in the FE that imports concrete validator classes (DIP inversion point).
 * Pattern: Factory — decouples chain creation from consumption.
 * SOLID: OCP · SRP · DIP
 *
 * OCP extension (Sprint 4 — CriticalPriorityValidator):
 *   1. Create modules/tickets/validators/CriticalPriorityValidator.ts
 *   2. Add one line in buildTicketChain():
 *        businessRuleV.addValidator(new CriticalPriorityValidator())
 *   3. Nothing else changes.
 */

import { BasicFieldValidator } from '../../modules/tickets/validators/BasicFieldValidator'
import { FileValidator } from '../../modules/tickets/validators/FileValidator'
import { BusinessRuleValidator } from '../../modules/tickets/validators/BusinessRuleValidator'
import type { BaseValidator } from '../base/BaseValidator'

export class ValidatorFactory {
  /**
   * Assemble the ticket-creation validation chain.
   *
   * Chain order (fail-fast left to right):
   *   BasicFieldValidator → FileValidator → BusinessRuleValidator
   *
   * @returns Root node. Caller invokes root.run(data).
   *
   * OCP note: add CriticalPriorityValidator in Sprint 4 by appending one addValidator() call.
   */
  static buildTicketChain(): BaseValidator {
    const basicFieldV      = new BasicFieldValidator()
    const fileV            = new FileValidator()
    const businessRuleV    = new BusinessRuleValidator()

    basicFieldV.addValidator(fileV).addValidator(businessRuleV)

    return basicFieldV
  }
}
