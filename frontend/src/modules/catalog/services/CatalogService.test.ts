import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn() },
}))

vi.mock('../../../infrastructure/http/ApiClient', () => ({
  apiClient: apiClientMock,
}))

import { catalogService } from './CatalogService'

const backendService = {
  id: 7,
  nombre: 'Infraestructura IT',
  descripcion: 'Servidores y redes',
  categoria: 'infraestructura',
  activo: true,
  imagen_url: 'https://example.com/cover.webp',
  imagenes: [],
}

describe('CatalogService public list compatibility', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['paginated object', { items: [backendService], total: 1 }],
    ['plain array', [backendService]],
  ])('maps the %s API response without breaking the catalog', async (_name, payload) => {
    apiClientMock.get.mockResolvedValue(payload)

    const services = await catalogService.getActiveServices()

    expect(services).toHaveLength(1)
    expect(services[0]).toMatchObject({
      id: '7',
      nombre: 'Infraestructura IT',
      imagenUrl: 'https://example.com/cover.webp',
    })
  })
})
