/**
 * useCatalog — Context + hook for browsing the service catalog.
 * DIP: depends on ICatalogClientView via Context, never on the concrete class.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { ICatalogClientView } from '../interfaces/ICatalogClientView'
import type { ServiceSummary, ServiceFilterOptions } from '../interfaces/ICatalogService'

export const CatalogServiceContext = createContext<ICatalogClientView | null>(null)

function useCatalogService(): ICatalogClientView {
  const service = useContext(CatalogServiceContext)
  if (!service) throw new Error('useCatalog must be used inside <CatalogProvider>.')
  return service
}

export function CatalogProvider({ service, children }: Readonly<{ service: ICatalogClientView; children: ReactNode }>) {
  return <CatalogServiceContext.Provider value={service}>{children}</CatalogServiceContext.Provider>
}

interface UseCatalogResult {
  services: ServiceSummary[]
  isLoading: boolean
  error: string | null
  setFilters: (f: ServiceFilterOptions) => void
}

export function useCatalog(): UseCatalogResult {
  const service = useCatalogService()
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [filters, setFilters] = useState<ServiceFilterOptions>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setServices(await service.getActiveServices(filters))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el catálogo')
    } finally {
      setIsLoading(false)
    }
  }, [service, filtersKey])

  useEffect(() => { load().catch(console.error) }, [load])

  return { services, isLoading, error, setFilters }
}
