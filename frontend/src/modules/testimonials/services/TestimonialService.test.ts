import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../../infrastructure/http/ApiClient', () => ({
  apiClient: apiClientMock,
}))

import { testimonialService } from './TestimonialService'

const backendTestimonial = {
  id: 9,
  autor: 'María Cedeño',
  empresa: 'Industria del Pacífico',
  calificacion: 5,
  comentario: 'Una experiencia técnica excelente y muy bien comunicada.',
  publicado_en: '2026-08-15T12:00:00Z',
  estado: 'pending' as const,
  nota_moderacion: '',
}

describe('TestimonialService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps the public API contract to the frontend domain', async () => {
    apiClientMock.get.mockResolvedValue({ items: [backendTestimonial], total: 1 })

    const items = await testimonialService.getPublicTestimonials()

    expect(apiClientMock.get).toHaveBeenCalledWith('/testimonios/')
    expect(items[0]).toMatchObject({
      id: 9,
      author: 'María Cedeño',
      company: 'Industria del Pacífico',
      rating: 5,
      status: 'pending',
    })
  })

  it('trims client content before sending it to moderation', async () => {
    apiClientMock.post.mockResolvedValue(backendTestimonial)

    await testimonialService.createMyTestimonial({
      rating: 5,
      comment: '  Servicio impecable y respuesta rápida.  ',
    })

    expect(apiClientMock.post).toHaveBeenCalledWith('/testimonios/mi-testimonio/', {
      calificacion: 5,
      comentario: 'Servicio impecable y respuesta rápida.',
    })
  })

  it('sends an explicit moderation command to the administrator endpoint', async () => {
    apiClientMock.patch.mockResolvedValue({ ...backendTestimonial, estado: 'approved' })

    await testimonialService.moderateTestimonial(9, { status: 'approved' })

    expect(apiClientMock.patch).toHaveBeenCalledWith('/testimonios/admin/9/', {
      estado: 'approved',
      nota_moderacion: '',
    })
  })
})
