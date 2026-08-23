import { describe, it, expect } from 'vitest'
import { NameValidator } from './NameValidator'
import { EmpresaValidator } from './EmpresaValidator'
import { RucValidator } from './RucValidator'
import { EmailValidator } from './EmailValidator'
import { PasswordValidator } from './PasswordValidator'

describe('NameValidator', () => {
  const validator = new NameValidator()

  it('passes with a valid name', () => {
    const result = validator.validate({ nombre: 'Juan Pérez' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails with empty name', () => {
    const result = validator.validate({ nombre: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El nombre es obligatorio.')
  })

  it('fails with whitespace-only name', () => {
    const result = validator.validate({ nombre: '   ' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El nombre es obligatorio.')
  })

  it('fails when nombre is missing', () => {
    const result = validator.validate({})
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El nombre es obligatorio.')
  })
})

describe('EmpresaValidator', () => {
  const validator = new EmpresaValidator()

  it('passes with a valid company name', () => {
    const result = validator.validate({ empresa: 'TechCorp S.A.' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails with empty company name', () => {
    const result = validator.validate({ empresa: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El nombre de la empresa es obligatorio.')
  })

  it('fails with whitespace-only company name', () => {
    const result = validator.validate({ empresa: '   ' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El nombre de la empresa es obligatorio.')
  })

  it('fails when empresa is missing', () => {
    const result = validator.validate({})
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El nombre de la empresa es obligatorio.')
  })
})

describe('RucValidator', () => {
  const validator = new RucValidator()

  it('passes with a valid 13-digit RUC', () => {
    const result = validator.validate({ ruc: '0991234567001' })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails with empty RUC', () => {
    const result = validator.validate({ ruc: '' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El RUC es obligatorio.')
  })

  it('fails when RUC is missing', () => {
    const result = validator.validate({})
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El RUC es obligatorio.')
  })

  it('fails with non-numeric RUC', () => {
    const result = validator.validate({ ruc: '099123456700A' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El RUC debe tener exactamente 13 dígitos numéricos.')
  })

  it('fails with less than 13 digits', () => {
    const result = validator.validate({ ruc: '0991234567' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El RUC debe tener exactamente 13 dígitos numéricos.')
  })

  it('fails with more than 13 digits', () => {
    const result = validator.validate({ ruc: '099123456700100' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El RUC debe tener exactamente 13 dígitos numéricos.')
  })
})

describe('Registration Chain (Name -> Empresa -> Ruc -> Email -> Password)', () => {
  it('passes when all fields are valid', () => {
    const name = new NameValidator()
    const empresa = new EmpresaValidator()
    const ruc = new RucValidator()
    const email = new EmailValidator()
    const password = new PasswordValidator()

    name.addValidator(empresa).addValidator(ruc).addValidator(email).addValidator(password)

    const result = name.run({
      nombre: 'Admin User',
      empresa: 'SassBlum Tech',
      ruc: '0991234567001',
      email: 'admin@sassblum.com',
      password: 'Password123',
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('stops at invalid name', () => {
    const name = new NameValidator()
    const empresa = new EmpresaValidator()
    name.addValidator(empresa)

    const result = name.run({
      nombre: '',
      empresa: 'SassBlum Tech',
    })

    expect(result.isValid).toBe(false)
    expect(result.field).toBe('nombre')
  })

  it('stops at invalid empresa before ruc', () => {
    const name = new NameValidator()
    const empresa = new EmpresaValidator()
    const ruc = new RucValidator()
    name.addValidator(empresa).addValidator(ruc)

    const result = name.run({
      nombre: 'Valido',
      empresa: '',
      ruc: '0991234567001',
    })

    expect(result.isValid).toBe(false)
    expect(result.field).toBe('empresa')
  })

  it('stops at invalid RUC before email', () => {
    const name = new NameValidator()
    const empresa = new EmpresaValidator()
    const ruc = new RucValidator()
    const email = new EmailValidator()
    name.addValidator(empresa).addValidator(ruc).addValidator(email)

    const result = name.run({
      nombre: 'Valido',
      empresa: 'Tech Corp',
      ruc: '123',
      email: 'bad-email',
    })

    expect(result.isValid).toBe(false)
    expect(result.field).toBe('ruc')
  })
})
