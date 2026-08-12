/**
 * useCatalog — Context + hook for browsing the service catalog.
 * DIP: depends on ICatalogClientView via Context, never on the concrete class.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { ICatalogClientView } from '../interfaces/ICatalogClientView'
import type { ServiceSummary, ServiceFilterOptions } from '../interfaces/ICatalogService'

// El componente CatalogProvider vive en CatalogProvider.tsx (Fast Refresh).
export const CatalogServiceContext = createContext<ICatalogClientView | null>(null)

function useCatalogService(): ICatalogClientView {
  const service = useContext(CatalogServiceContext)
  if (!service) throw new Error('useCatalog must be used inside <CatalogProvider>.')
  return service
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
  const requestIdRef = useRef(0)
  const hasStartedRef = useRef(false)
  const invalidateRequests = useCallback(() => { requestIdRef.current++ }, [])

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      // Deps exactas: se reconstruye desde la clave serializada (exhaustive-deps).
      const parsed: ServiceFilterOptions = JSON.parse(filtersKey)
      const nextServices = await service.getActiveServices(parsed)
      if (requestId === requestIdRef.current) setServices(nextServices)
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Error al cargar el catálogo')
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [service, filtersKey])

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      load().catch(console.error)
      return invalidateRequests
    }

    requestIdRef.current++
    const timeoutId = globalThis.setTimeout(() => load().catch(console.error), 350)
    return () => {
      globalThis.clearTimeout(timeoutId)
      invalidateRequests()
    }
  }, [load, invalidateRequests])

  return { services, isLoading, error, setFilters }
}
