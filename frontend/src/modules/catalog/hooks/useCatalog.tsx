/**
 * useCatalog — Context + hook for browsing the service catalog.
 * DIP: depends on ICatalogClientView via Context, never on the concrete class.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { ICatalogClientView } from '../interfaces/ICatalogClientView'
import type { ServiceSummary, ServiceFilterOptions } from '../interfaces/ICatalogService'
import { PUBLIC_SERVICES } from '../../../generated/publicContentSnapshot'

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

function snapshotServices(filters: ServiceFilterOptions): ServiceSummary[] {
  const category = filters.categoria?.trim().toLocaleLowerCase('es')
  const search = filters.busqueda?.trim().toLocaleLowerCase('es')

  return PUBLIC_SERVICES
    .filter((service) => {
      const matchesCategory = !category || service.categoria.toLocaleLowerCase('es') === category
      const searchable = `${service.nombre} ${service.descripcion} ${service.categoria}`.toLocaleLowerCase('es')
      return matchesCategory && (!search || searchable.includes(search))
    })
    .map((service) => ({
      ...service,
      imagenes: service.imagenes.map((image) => ({ ...image })),
    }))
}

export function useCatalog(): UseCatalogResult {
  const service = useCatalogService()
  const [filters, setFilters] = useState<ServiceFilterOptions>({})
  const [services, setServices] = useState<ServiceSummary[]>(() => snapshotServices(filters))
  const [isLoading, setIsLoading] = useState(PUBLIC_SERVICES.length === 0)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const hasStartedRef = useRef(false)
  const invalidateRequests = useCallback(() => { requestIdRef.current++ }, [])

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])
  const localServices = useMemo(() => snapshotServices(filters), [filters])

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    // The generated snapshot paints immediately while Render wakes. The API
    // remains authoritative and replaces it as soon as the request completes.
    setServices(localServices)
    setIsLoading(localServices.length === 0)
    setError(null)
    try {
      // Deps exactas: se reconstruye desde la clave serializada (exhaustive-deps).
      const parsed: ServiceFilterOptions = JSON.parse(filtersKey)
      const nextServices = await service.getActiveServices(parsed)
      if (requestId === requestIdRef.current) setServices(nextServices)
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setServices(localServices)
        if (localServices.length === 0) {
          setError(err instanceof Error ? err.message : 'Error al cargar el catálogo')
        }
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [service, filtersKey, localServices])

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
