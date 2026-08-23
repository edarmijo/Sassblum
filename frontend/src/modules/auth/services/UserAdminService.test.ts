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
