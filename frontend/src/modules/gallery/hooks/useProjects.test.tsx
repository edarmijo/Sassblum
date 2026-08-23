import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn() },
}))

vi.mock('../../../infrastructure/http/ApiClient', () => ({
  apiClient: apiClientMock,
}))

import { useProjects } from './useProjects'

describe('useProjects public snapshot', () => {
  beforeEach(() => vi.clearAllMocks())

  it('replaces the snapshot when fresh API content arrives', async () => {
    apiClientMock.get.mockResolvedValue({
      items: [{
        id: 71,
        titulo: 'Proyecto actualizado',
        descripcion: 'Contenido fresco de la API',
        tag: 'Redes',
        imagen_url: 'https://example.com/project.webp',
      }],
    })

    const { result } = renderHook(() => useProjects())

    await waitFor(() => expect(result.current.projects).toEqual([{
      id: '71',
      titulo: 'Proyecto actualizado',
      descripcion: 'Contenido fresco de la API',
      tag: 'Redes',
      imagenUrl: 'https://example.com/project.webp',
    }]))
    expect(result.current.loading).toBe(false)
  })

  it('keeps the snapshot when the public API is unavailable', async () => {
    apiClientMock.get.mockRejectedValue(new Error('backend asleep'))

    const { result } = renderHook(() => useProjects())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects.length).toBeGreaterThan(0)
  })
})
