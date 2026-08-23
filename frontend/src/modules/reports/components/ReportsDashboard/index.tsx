import { useState, useEffect, useRef } from 'react'
import { Filter, X } from 'lucide-react'
import { useReports } from '../../hooks/useReports'
import { useFilters } from '../../../../core/hooks/useFilters'
import { ExportButton } from '../ExportButton'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import { userAdminService } from '../../../auth/services/UserAdminService'
import { catalogService } from '../../../catalog/services/CatalogService'
import type { AdminUser } from '../../../auth/interfaces/IUserAdminActions'
import type { ServiceSummary } from '../../../catalog/interfaces/ICatalogService'
import type { ReportFilters, ReportFormat } from '../../interfaces/IReportsService'

const ESTADOS = ['Nuevo', 'EnProceso', 'EnEspera', 'Resuelto', 'Cerrado']
const EMPTY_REPORT_FILTERS: ReportFilters = {}

/**
 * H#6 (cliente): Reports dashboard with advanced filters.
 * Filters: RUC, cliente nombre, rango de fechas, estado, servicio, técnico asignado.
 * Export: PDF and Excel.
 *
 * Vicky Pinto: "Voy a filtrar por RUC y por mes, del 1 al 30 de junio,
 * y me va a presentar la pantalla de búsqueda y de ahí puedo descargar en PDF o Excel."
 */
export function ReportsDashboard() {
  const { filters, updateFilter, clearFilters, hasFilters: hasDraftFilters } = useFilters<ReportFilters>(EMPTY_REPORT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(EMPTY_REPORT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const workersLoadedRef = useRef(false)
  const servicesLoadedRef = useRef(false)
  const [workers, setWorkers] = useState<AdminUser[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const { summary, isLoading, error, exportReport, copyReport, printReport } = useReports(appliedFilters)
  const hasAppliedFilters = Object.values(appliedFilters).some(Boolean)

  // Lista de técnicos activos para el filtro "Técnico asignado"
  useEffect(() => {
    if (!showFilters) return
    if (!workersLoadedRef.current) {
      void userAdminService.listUsers({ role: 'worker', estado: 'activo' })
        .then((items) => {
          setWorkers(items)
          workersLoadedRef.current = true
        })
        .catch(() => setWorkers([]))
    }
    if (!servicesLoadedRef.current) {
      void catalogService.getActiveServices()
        .then((items) => {
          setServices(items)
          servicesLoadedRef.current = true
        })
        .catch(() => setServices([]))
    }
  }, [showFilters])

  if (isLoading && !summary) return <p className="text-sm text-muted-foreground py-8">Cargando reporte…</p>
  if (error && !summary) return <p className="text-sm text-destructive">{error}</p>
  if (!summary) return null

  const maxEstado = Math.max(1, ...Object.values(summary.porEstado))

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Reportes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen de tickets del sistema{hasAppliedFilters ? ' (filtrado)' : ''}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
            className={showFilters ? 'bg-brand-cyan/10' : ''}
          >
            <Filter className="h-4 w-4 mr-1" />Filtros
            {hasAppliedFilters && <span className="ml-1 h-2 w-2 rounded-full bg-brand-cyan" />}
          </Button>
          <ExportButton
            onExport={(fmt: ReportFormat) => exportReport(fmt)}
            onCopy={copyReport}
            onPrint={printReport}
          />
        </div>
      </header>

      {/* H#6: Advanced filters panel */}
      {showFilters && (
        <div className="rounded-xl p-4 space-y-4" style={{ background: 'rgba(8,22,36,0.82)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(24px)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Filtros avanzados</h3>
            {hasDraftFilters && (
              <Button variant="ghost" size="sm" onClick={() => { clearFilters(); setAppliedFilters(EMPTY_REPORT_FILTERS) }}>
                <X className="h-3 w-3 mr-1" />Limpiar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="f-ruc">RUC del cliente</Label>
              <Input
                id="f-ruc"
                value={filters.clienteRuc ?? ''}
                onChange={(e) => updateFilter('clienteRuc', e.target.value)}
                placeholder="Ej: 0991234567001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-cliente">Nombre / Email cliente</Label>
              <Input
                id="f-cliente"
                value={filters.clienteNombre ?? ''}
                onChange={(e) => updateFilter('clienteNombre', e.target.value)}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={filters.estado ?? 'none'} onValueChange={(v) => updateFilter('estado', v === 'none' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Servicio</Label>
              <Select value={filters.servicioId?.toString() ?? 'none'} onValueChange={(v) => updateFilter('servicioId', v === 'none' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los servicios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-desde">Fecha desde</Label>
              <Input
                id="f-desde"
                type="date"
                value={filters.fechaDesde ?? ''}
                onChange={(e) => updateFilter('fechaDesde', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-hasta">Fecha hasta</Label>
              <Input
                id="f-hasta"
                type="date"
                value={filters.fechaHasta ?? ''}
                onChange={(e) => updateFilter('fechaHasta', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Técnico asignado</Label>
              <Select value={filters.asignadoId?.toString() ?? 'none'} onValueChange={(v) => updateFilter('asignadoId', v === 'none' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los técnicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.nombre ? `${w.nombre} ${w.apellido}`.trim() : w.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => setAppliedFilters({ ...filters })} disabled={isLoading} className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy">
              {isLoading ? 'Aplicando…' : 'Aplicar filtros'}
            </Button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Kpi label="Total" value={summary.total} accent="text-foreground" />
        <Kpi label="Abiertos" value={summary.abiertos} accent="text-amber-600" />
        <Kpi label="Cerrados" value={summary.cerrados} accent="text-green-600" />
      </div>

      {/* By estado */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Por estado</h3>
        <div className="space-y-2.5">
          {Object.entries(summary.porEstado).map(([estado, n]) => (
            <div key={estado} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{estado}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-brand-cyan-dark h-full rounded-full transition-[width] duration-500" style={{ width: `${(n / maxEstado) * 100}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-8 text-right tabular-nums">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Kpi({ label, value, accent = 'text-foreground' }: Readonly<{ label: string; value: number; accent?: string }>) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}
