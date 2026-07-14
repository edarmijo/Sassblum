import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type {
  IReportsService,
  ReportSummary,
  ReportFilters,
  ReportFormat,
} from '../interfaces/IReportsService'

const ReportsServiceContext = createContext<IReportsService | null>(null)

function useReportsService(): IReportsService {
  const s = useContext(ReportsServiceContext)
  if (!s) throw new Error('useReports must be used inside <ReportsProvider>.')
  return s
}

export function ReportsProvider({ service, children }: Readonly<{ service: IReportsService; children: ReactNode }>) {
  return <ReportsServiceContext.Provider value={service}>{children}</ReportsServiceContext.Provider>
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
      setSummary(await service.getDashboard(filters))
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
