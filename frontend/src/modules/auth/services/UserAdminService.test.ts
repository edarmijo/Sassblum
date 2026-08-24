import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('../../../infrastructure/http/ApiClient', () => ({
  apiClient: apiClientMock,
}))

import { userAdminService } from './UserAdminService'

describe('UserAdminService B13b', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates only the approved name fields through the registered user route', async () => {
    apiClientMock.patch.mockResolvedValue({
      id: 17,
      email: 'trabajador@sassblum.com',
      nombre: 'María José',
      apellido: 'Pérez',
      rol: 'TRABAJADOR',
      estado: 'activo',
      email_verificado: true,
    })

    const user = await userAdminService.updateUser('17', {
      nombre: 'María José',
      apellido: 'Pérez',
    })

    expect(apiClientMock.patch).toHaveBeenCalledWith('/usuarios/17', {
      nombre: 'María José',
      apellido: 'Pérez',
    })
    expect(user).toMatchObject({
      id: '17',
      nombre: 'María José',
      apellido: 'Pérez',
      emailVerificado: true,
    })
  })
})

describe('UserAdminService B15', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps a manual mailbox created in the same worker request', async () => {
    apiClientMock.post.mockResolvedValue({
      id: 17,
      email: 'trabajador@sassblum.com',
      nombre: 'Ana',
      apellido: 'Técnica',
      rol: 'worker',
      estado: 'activo',
      email_verificado: true,
      buzon_estado: 'creado',
      buzon_gestion: 'manual',
    })

    const result = await userAdminService.createUser({
      nombre: 'Ana',
      apellido: 'Técnica',
      email: 'trabajador@sassblum.com',
      password: 'ClaveSegura123',
      role: 'worker',
    })

    expect(result).toMatchObject({
      buzonEstado: 'creado',
      buzonGestion: 'manual',
    })
  })

  it('retries a pending mailbox through its explicit route', async () => {
    apiClientMock.post.mockResolvedValue({
      id: 17,
      email: 'trabajador@sassblum.com',
      nombre: 'Ana',
      apellido: 'Técnica',
      rol: 'worker',
      estado: 'activo',
      email_verificado: true,
      buzon_estado: 'creado',
      buzon_password: 'ephemeral-value',
    })

    const result = await userAdminService.retryMailbox('17')

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/usuarios/17/buzon/reintentar',
      {},
    )
    expect(result).toMatchObject({
      buzonEstado: 'creado',
      buzonPassword: 'ephemeral-value',
    })
  })

  it('rotates an occupant without sending email, role or credentials', async () => {
    apiClientMock.post.mockResolvedValue({
      id: 17,
      email: 'tecnico1@sassblum.com',
      nombre: 'Carlos',
      apellido: 'Nuevo',
      rol: 'worker',
      estado: 'activo',
      email_verificado: true,
      buzon_estado: 'creado',
      app_password: 'app-ephemeral',
      buzon_password: 'mail-ephemeral',
    })

    const result = await userAdminService.rotateOccupant('17', {
      nombre: 'Carlos',
      apellido: 'Nuevo',
    })

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/usuarios/17/rotar-ocupante',
      { nombre: 'Carlos', apellido: 'Nuevo' },
    )
    expect(result).toMatchObject({
      email: 'tecnico1@sassblum.com',
      appPassword: 'app-ephemeral',
      buzonPassword: 'mail-ephemeral',
    })
  })

  it('maps the explicit manual rotation contract', async () => {
    apiClientMock.post.mockResolvedValue({
      id: 17,
      email: 'tecnico1@sassblum.com',
      nombre: 'Carlos',
      apellido: 'Nuevo',
      rol: 'worker',
      estado: 'activo',
      email_verificado: true,
      buzon_estado: 'creado',
      buzon_gestion: 'manual',
      app_password: 'app-ephemeral',
    })

    const result = await userAdminService.rotateOccupantManually('17', {
      nombre: 'Carlos',
      apellido: 'Nuevo',
      emailConfirmacion: 'tecnico1@sassblum.com',
      rotacionBuzonConfirmada: true,
    })

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/usuarios/17/rotar-ocupante-manual',
      {
        nombre: 'Carlos',
        apellido: 'Nuevo',
        email_confirmacion: 'tecnico1@sassblum.com',
        rotacion_buzon_confirmada: true,
      },
    )
    expect(result).toMatchObject({
      appPassword: 'app-ephemeral',
      buzonGestion: 'manual',
    })
    expect(result.buzonPassword).toBeUndefined()
  })
})
