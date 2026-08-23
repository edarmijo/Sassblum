import { describe, expect, it } from 'vitest'
import { AuthValidatorFactory } from './AuthValidatorFactory'

describe('AuthValidatorFactory', () => {
  it('builds the complete registration chain in business-rule order', () => {
    const result = AuthValidatorFactory.buildRegistrationChain().run({
      empresa: 'Empresa',
      tipoIdentificacion: 'Cedula',
      ruc: '0912345678',
      email: 'cliente@example.com',
      password: 'Clave1234',
    })
    expect(result.isValid).toBe(true)
  })

  it('builds a client profile chain without email or password concerns', () => {
    const result = AuthValidatorFactory.buildClientProfileChain().run({
      empresa: 'Empresa',
      tipoIdentificacion: 'RUC',
      ruc: '0991234567001',
    })
    expect(result.isValid).toBe(true)
  })
})
