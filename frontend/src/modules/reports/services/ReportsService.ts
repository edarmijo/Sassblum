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

export class ReportsService implements IReportsService {
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
    const blob = await this.requestReport(formato, filters)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_tickets.${this.extensionFor(formato)}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async copyReport(filters?: ReportFilters): Promise<void> {
    if (!navigator.clipboard?.writeText) {
      throw new Error('El navegador no permite copiar el reporte al portapapeles.')
    }
    const blob = await this.requestReport('csv', filters)
    const csv = (await blob.text()).replace(/^\uFEFF/, '')
    await navigator.clipboard.writeText(csv)
  }

  async printReport(filters?: ReportFilters): Promise<void> {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Habilita las ventanas emergentes para imprimir el reporte.')
    }
    printWindow.opener = null
    printWindow.document.title = 'Preparando reporte para imprimir…'

    try {
      const blob = await this.requestReport('pdf', filters)
      const url = URL.createObjectURL(blob)
      let cleaned = false
      const cleanup = () => {
        if (cleaned) return
        cleaned = true
        URL.revokeObjectURL(url)
      }
      printWindow.addEventListener('afterprint', cleanup, { once: true })
      printWindow.addEventListener('pagehide', cleanup, { once: true })
      printWindow.addEventListener('load', () => {
        printWindow.focus()
        printWindow.print()
      }, { once: true })
      printWindow.location.replace(url)
    } catch (error) {
      printWindow.close()
      throw error
    }
  }

  private async requestReport(formato: ReportFormat, filters?: ReportFilters): Promise<Blob> {
    return apiClient.post<Blob>(
      '/reportes/exportar',
      { formato, ...buildFilters(filters) },
      { responseType: 'blob' },
    )
  }

  private extensionFor(formato: ReportFormat): string {
    return formato === 'excel' ? 'xlsx' : formato
  }
}

export const reportsService = new ReportsService()
