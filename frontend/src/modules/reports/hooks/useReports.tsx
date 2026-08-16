import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type {
  IReportsService,
  ReportSummary,
  ReportFilters,
  ReportFormat,
} from '../interfaces/IReportsService'

// El componente ReportsProvider vive en ReportsProvider.tsx (Fast Refresh).
export const ReportsServiceContext = createContext<IReportsService | null>(null)

function useReportsService(): IReportsService {
  const s = useContext(ReportsServiceContext)
  if (!s) throw new Error('useReports must be used inside <ReportsProvider>.')
  return s
}

export function useReports(filters?: ReportFilters) {
  const service = useReportsService()
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const invalidateRequests = useCallback(() => { requestIdRef.current++ }, [])

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      // Deps exactas: se reconstruye desde la clave serializada (exhaustive-deps).
      const parsed: ReportFilters = JSON.parse(filtersKey)
      const result = await service.getDashboard(parsed)
      if (requestId === requestIdRef.current) setSummary(result)
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Error al cargar el reporte')
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [service, filtersKey])

  useEffect(() => {
    load().catch(console.error)
    return invalidateRequests
  }, [load, invalidateRequests])

  const exportReport = useCallback(
    (formato: ReportFormat) => service.exportReport(formato, filters),
    [service, filters],
  )

  return { summary, isLoading, error, exportReport, refresh: load }
}
