import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ClientLogo, IClientLogoService } from '../interfaces/IClientLogoService'
import { ClientLogoProvider } from './ClientLogoProvider'
import { usePublicClientLogos } from './useClientLogo'

function wrapper(result: Promise<ClientLogo[]>) {
  const service: IClientLogoService = {
    getPublicClientLogos: () => result,
    getAdminClientLogos: async () => [],
    createClientLogo: async (data) => ({ id: 1, ...data }),
    updateClientLogo: async (id, data) => ({ id, ...data }),
    deleteClientLogo: async () => undefined,
  }

  return function ClientLogoTestProvider({ children }: Readonly<{ children: ReactNode }>) {
    return <ClientLogoProvider service={service}>{children}</ClientLogoProvider>
  }
}

describe('usePublicClientLogos snapshot', () => {
  it('replaces the snapshot when fresh API content arrives', async () => {
    const fresh: ClientLogo[] = [{
      id: 81,
      nombre: 'Cliente actualizado',
      logoUrl: 'https://example.com/logo.webp',
      activo: true,
      orden: 1,
    }]
    const { result } = renderHook(() => usePublicClientLogos(), {
      wrapper: wrapper(Promise.resolve(fresh)),
    })

    await waitFor(() => expect(result.current.clientLogos).toEqual(fresh))
    expect(result.current.loading).toBe(false)
  })

  it('keeps the snapshot when the public API is unavailable', async () => {
    const { result } = renderHook(() => usePublicClientLogos(), {
      wrapper: wrapper(Promise.reject(new Error('backend asleep'))),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.clientLogos.length).toBeGreaterThan(0)
  })
})
