/**
 * ReportsService — concrete IReportsService using ApiClient.
 * SRP: reports HTTP + download handling. DIP: hook depends on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import { querySuffix } from '../../../core/utils/query'
import type {
  IReportsService,
  ReportSummary,
  ReportFilters,
  ReportFormat,
} from '../interfaces/IReportsService'

function buildFilters(filters?: ReportFilters): Record<string, string> {
  const out: Record<string, string> = {}
  if (filters?.estado) out.estado = filters.estado
  if (filters?.servicioId) out.servicio_id = filters.servicioId
  if (filters?.fechaDesde) out.fecha_desde = filters.fechaDesde
  if (filters?.fechaHasta) out.fecha_hasta = filters.fechaHasta
  if (filters?.clienteRuc) out.cliente_ruc = filters.clienteRuc
  if (filters?.clienteNombre) out.cliente_nombre = filters.clienteNombre
  if (filters?.asignadoId) out.asignado_id = filters.asignadoId
  return out
}

class ReportsService implements IReportsService {
  async getDashboard(filters?: ReportFilters): Promise<ReportSummary> {
    const params = new URLSearchParams(buildFilters(filters))
    const data = await apiClient.get<{
      total: number
      abiertos: number
      cerrados: number
      por_estado: Record<string, number>
      por_prioridad: Record<string, number>
    }>(`/reportes/tickets${querySuffix(params)}`)
    return {
      total: data.total,
      abiertos: data.abiertos,
      cerrados: data.cerrados,
      porEstado: data.por_estado,
      porPrioridad: data.por_prioridad,
    }
  }

  async exportReport(formato: ReportFormat, filters?: ReportFilters): Promise<void> {
    const blob = await apiClient.post<Blob>(
      '/reportes/exportar',
      { formato, ...buildFilters(filters) },
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_tickets.${formato === 'excel' ? 'xlsx' : formato}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
}

export const reportsService = new ReportsService()
