/** Composition root for authentication form validator chains. */

import type { IFormValidator } from '../interfaces/IFormValidator'
import { EmailValidator } from './EmailValidator'
import { EmpresaValidator } from './EmpresaValidator'
import { IdentificationValidator } from './IdentificationValidator'
import { PasswordValidator } from './PasswordValidator'

export class AuthValidatorFactory {
  static buildRegistrationChain(): IFormValidator {
    const empresa = new EmpresaValidator()
    empresa
      .addValidator(new IdentificationValidator())
      .addValidator(new EmailValidator())
      .addValidator(new PasswordValidator())
    return empresa
  }

  static buildClientProfileChain(): IFormValidator {
    const empresa = new EmpresaValidator()
    empresa.addValidator(new IdentificationValidator())
    return empresa
  }
}
