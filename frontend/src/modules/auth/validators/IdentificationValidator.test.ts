import { describe, expect, it } from 'vitest'
import { IdentificationValidator } from './IdentificationValidator'

describe('IdentificationValidator', () => {
  it.each([
    ['RUC', '0991234567001'],
    ['Cedula', '0912345678'],
  ] as const)('accepts a valid %s', (tipoIdentificacion, ruc) => {
    expect(new IdentificationValidator().validate({ tipoIdentificacion, ruc }).isValid).toBe(true)
  })

  it.each([
    ['RUC', '099123456700'],
    ['RUC', '09912345670012'],
    ['RUC', '099123-567001'],
    ['RUC', '099123 567001'],
    ['RUC', '099123456700A'],
    ['RUC', ' 0991234567001'],
    ['Cedula', '091234567'],
    ['Cedula', '09123456789'],
    ['Cedula', '09123-5678'],
    ['Cedula', '09123 5678'],
    ['Cedula', '091234567A'],
  ] as const)('rejects invalid %s value %s', (tipoIdentificacion, ruc) => {
    expect(new IdentificationValidator().validate({ tipoIdentificacion, ruc }).isValid).toBe(false)
  })
})
