/** Type-aware validation for RUC and cédula account identification. */

import { BaseValidator, type ValidationResult } from '../../../core/base/BaseValidator'
import type { IdentificationType } from '../interfaces/IAuthService'

interface IdentificationData {
  tipoIdentificacion?: IdentificationType
  ruc?: string
}

export const IDENTIFICATION_LENGTH: Record<IdentificationType, number> = {
  RUC: 13,
  Cedula: 10,
}

export class IdentificationValidator extends BaseValidator {
  validate(data: unknown): ValidationResult {
    const { tipoIdentificacion = 'RUC', ruc = '' } = (data ?? {}) as IdentificationData
    const expectedLength = IDENTIFICATION_LENGTH[tipoIdentificacion]

    if (!expectedLength) {
      return {
        isValid: false,
        errors: ['Selecciona un tipo de identificación válido.'],
        field: 'tipoIdentificacion',
      }
    }
    if (!ruc) {
      return { isValid: false, errors: ['La identificación es obligatoria.'], field: 'ruc' }
    }
    if (!/^\d+$/.test(ruc)) {
      return {
        isValid: false,
        errors: ['La identificación debe contener solo dígitos, sin espacios ni guiones.'],
        field: 'ruc',
      }
    }
    if (ruc.length !== expectedLength) {
      const label = tipoIdentificacion === 'RUC' ? 'El RUC' : 'La cédula'
      return {
        isValid: false,
        errors: [`${label} debe tener exactamente ${expectedLength} dígitos.`],
        field: 'ruc',
      }
    }
    return { isValid: true, errors: [], field: 'ruc' }
  }
}

export function hasCompleteIdentification(data: IdentificationData): boolean {
  return new IdentificationValidator().validate(data).isValid
}
