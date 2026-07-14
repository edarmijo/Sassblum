import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'
import { catalogService } from '../../../catalog/services/CatalogService'
import { userAdminService } from '../../../auth/services/UserAdminService'
import type { TicketFilterOptions } from '../../interfaces/ITicketService'
import type { ServiceSummary } from '../../../catalog/interfaces/ICatalogService'
import type { AdminUser } from '../../../auth/interfaces/IUserAdminActions'

const ESTADOS = ['Nuevo', 'EnProceso', 'EnEspera', 'Resuelto', 'Cerrado']
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Critica']

interface TicketFiltersProps {
  filters: TicketFilterOptions
  onChange: (filters: TicketFilterOptions) => void
}

/** SRP: advanced filter panel for tickets (server-side). */
export function TicketFilters({ filters, onChange }: Readonly<TicketFiltersProps>) {
  const [show, setShow] = useState(false)
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [workers, setWorkers] = useState<AdminUser[]>([])

  useEffect(() => {
    void catalogService.getActiveServices().then(setServices).catch(() => setServices([]))
    void userAdminService.listUsers({ role: 'worker', estado: 'activo' }).then(setWorkers).catch(() => setWorkers([]))
  }, [])

  const hasFilters = Object.values(filters).some(Boolean)

  const update = <K extends keyof TicketFilterOptions>(key: K, value: TicketFilterOptions[K] | string) => {
    let parsedValue: TicketFilterOptions[K] | string | undefined = value
    if (value === 'none') parsedValue = undefined
    const next = { ...filters, [key]: parsedValue }
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ) as TicketFilterOptions
    onChange(cleaned)
  }

  const clear = () => onChange({})

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShow((s) => !s)}
          className={show ? 'bg-brand-cyan/10' : ''}
        >
          <Filter className="h-4 w-4 mr-1" />Filtros
          {hasFilters && <span className="ml-1 h-2 w-2 rounded-full bg-brand-cyan" />}
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <X className="h-3 w-3 mr-1" />Limpiar
          </Button>
        )}
      </div>

      {show && (
        <div className="rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ background: 'rgba(8,22,36,0.82)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(24px)' }}>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={filters.estado ?? 'none'} onValueChange={(v) => update('estado', v === 'none' ? undefined : v as TicketFilterOptions['estado'])}>
              <SelectTrigger><SelectValue placeholder="Todos los estados" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos</SelectItem>
                {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridad</Label>
            <Select value={filters.prioridad ?? 'none'} onValueChange={(v) => update('prioridad', v === 'none' ? undefined : v as TicketFilterOptions['prioridad'])}>
              <SelectTrigger><SelectValue placeholder="Todas las prioridades" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todas</SelectItem>
                {PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Servicio</Label>
            <Select value={filters.servicioId?.toString() ?? ''} onValueChange={(v) => update('servicioId', v)}>
              <SelectTrigger><SelectValue placeholder="Todos los servicios" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos</SelectItem>
                {services.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tf-desde">Fecha desde</Label>
            <Input id="tf-desde" type="date" value={filters.fechaDesde ?? ''} onChange={(e) => update('fechaDesde', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tf-hasta">Fecha hasta</Label>
            <Input id="tf-hasta" type="date" value={filters.fechaHasta ?? ''} onChange={(e) => update('fechaHasta', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tf-cliente">Cliente (ID)</Label>
            <Input id="tf-cliente" value={filters.clienteId ?? ''} onChange={(e) => update('clienteId', e.target.value)} placeholder="ID del cliente" />
          </div>
          <div className="space-y-1.5">
            <Label>Técnico asignado</Label>
            <Select value={filters.asignadoId?.toString() ?? ''} onValueChange={(v) => update('asignadoId', v)}>
              <SelectTrigger><SelectValue placeholder="Todos los técnicos" /></SelectTrigger>
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
      )}
    </div>
  )
}
