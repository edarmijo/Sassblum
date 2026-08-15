import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ICatalogClientView } from '../interfaces/ICatalogClientView'
import type { ServiceDetail, ServiceSummary } from '../interfaces/ICatalogService'
import { CatalogProvider } from './CatalogProvider'
import { useCatalog } from './useCatalog'

function wrapper(service: ICatalogClientView) {
  return function CatalogTestProvider({ children }: Readonly<{ children: ReactNode }>) {
    return <CatalogProvider service={service}>{children}</CatalogProvider>
  }
}

function serviceWith(result: Promise<ServiceSummary[]>): ICatalogClientView {
  return {
    getActiveServices: vi.fn(() => result),
    getServiceDetail: vi.fn<(_id: string) => Promise<ServiceDetail>>(),
  }
}

describe('useCatalog public snapshot', () => {
  it('renders real catalog content without waiting for the API', () => {
    const neverResolves = new Promise<ServiceSummary[]>(() => undefined)
    const { result } = renderHook(() => useCatalog(), {
      wrapper: wrapper(serviceWith(neverResolves)),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.services.length).toBeGreaterThan(0)
    expect(result.current.services.every((service) => service.imagenUrl.length > 0)).toBe(true)
  })

  it('keeps snapshot content when the API is unavailable', async () => {
    const { result } = renderHook(() => useCatalog(), {
      wrapper: wrapper(serviceWith(Promise.reject(new Error('backend asleep')))),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.services.length).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
  })

  it('replaces the snapshot when fresh API content arrives', async () => {
    const fresh: ServiceSummary[] = [{
      id: 'fresh',
      nombre: 'Servicio actualizado',
      descripcion: 'Contenido de la API',
      categoria: 'Soporte',
      activo: true,
      imagenUrl: 'https://example.com/fresh.webp',
      imagenes: [],
      descripcionDetalle: '',
    }]
    const { result } = renderHook(() => useCatalog(), {
      wrapper: wrapper(serviceWith(Promise.resolve(fresh))),
    })

    await waitFor(() => expect(result.current.services).toEqual(fresh))
  })
})
