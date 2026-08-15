import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ClientLogo, ClientLogoPayload, IClientLogoService } from '../interfaces/IClientLogoService'
import { PUBLIC_CLIENT_LOGOS } from '../../../generated/publicContentSnapshot'

export const ClientLogoServiceContext = createContext<IClientLogoService | null>(null)

function useClientLogoService(): IClientLogoService {
  const service = useContext(ClientLogoServiceContext)
  if (!service) throw new Error('useClientLogoAdmin must be used inside <ClientLogoProvider>.')
  return service
}

/** State and mutations for the administrator client-logo panel. */
export function useClientLogoAdmin() {
  const service = useClientLogoService()
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setClientLogos(await service.getAdminClientLogos())
    } finally {
      setLoading(false)
    }
  }, [service])

  const createClientLogo = useCallback(
    (data: ClientLogoPayload, logo?: File | null) => service.createClientLogo(data, logo),
    [service],
  )

  const updateClientLogo = useCallback(
    (id: number, data: ClientLogoPayload, logo?: File | null) => service.updateClientLogo(id, data, logo),
    [service],
  )

  const deleteClientLogo = useCallback((id: number) => service.deleteClientLogo(id), [service])

  useEffect(() => {
    load().catch(() => setClientLogos([]))
  }, [load])

  return { clientLogos, loading, load, createClientLogo, updateClientLogo, deleteClientLogo }
}

/** Estado de solo lectura para el carrusel público de clientes. */
export function usePublicClientLogos() {
  const service = useClientLogoService()
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>(() =>
    PUBLIC_CLIENT_LOGOS.map((logo) => ({ ...logo })),
  )
  const [loading, setLoading] = useState(PUBLIC_CLIENT_LOGOS.length === 0)

  useEffect(() => {
    let mounted = true
    service.getPublicClientLogos()
      .then((logos) => { if (mounted) setClientLogos(logos) })
      // Keep the build-time snapshot when the public API is unavailable.
      .catch(() => undefined)
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [service])

  return { clientLogos, loading }
}
