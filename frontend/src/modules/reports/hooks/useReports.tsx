import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
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

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Deps exactas: se reconstruye desde la clave serializada (exhaustive-deps).
      const parsed: ReportFilters = JSON.parse(filtersKey)
      setSummary(await service.getDashboard(parsed))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte')
    } finally {
      setIsLoading(false)
    }
  }, [service, filtersKey])

  useEffect(() => { load().catch(console.error) }, [load])

  const exportReport = useCallback(
    (formato: ReportFormat) => service.exportReport(formato, filters),
    [service, filters],
  )

  return { summary, isLoading, error, exportReport, refresh: load }
}
