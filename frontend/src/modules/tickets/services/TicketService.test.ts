import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../../infrastructure/http/ApiClient', () => ({
  apiClient: apiClientMock,
}))

import { ticketService } from './TicketService'

const DETAIL_RESPONSE = {
  id: 42,
  numero: 'T-2026-0042',
  asunto: 'Prueba de estado',
  estado: 'Resuelto',
  prioridad: 'Media',
  servicio_nombre: 'Soporte',
  creado_en: '2026-08-09T00:00:00Z',
  descripcion: 'Detalle de prueba',
  cliente_nombre: 'Cliente',
  cliente_email: 'cliente@example.com',
  cliente_ruc: '0999999999001',
  cliente_empresa: 'Empresa',
  asignado_nombre: null,
  adjuntos: [],
  eventos: [],
  actualizado_en: '2026-08-09T00:00:00Z',
}

const COMMENT_RESPONSE = {
  id: 9,
  tipo_evento: 'comentario',
  estado_anterior: '',
  estado_nuevo: '',
  comentario: 'Seguimiento registrado.',
  autor_nombre: 'Administrador',
  creado_en: '2026-08-09T00:00:00Z',
}

describe('TicketService action contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the registered PATCH route when changing a ticket status', async () => {
    apiClientMock.patch.mockResolvedValue(DETAIL_RESPONSE)

    await ticketService.updateStatus('42', 'Resuelto', 'Caso resuelto.')

    expect(apiClientMock.patch).toHaveBeenCalledWith('/tickets/42/estado', {
      estado: 'Resuelto',
      comentario: 'Caso resuelto.',
    })
  })

  it('uses the registered POST route when adding a ticket comment', async () => {
    apiClientMock.post.mockResolvedValue(COMMENT_RESPONSE)

    await ticketService.addComment('42', 'Seguimiento registrado.')

    expect(apiClientMock.post).toHaveBeenCalledWith('/tickets/42/comentario', {
      comentario: 'Seguimiento registrado.',
    })
  })
})
