import { Badge } from '../../../core/ui/badge'
import type { TicketEstado, TicketPrioridad } from '../interfaces/ITicketService'

const SOFT = 'border font-medium'

const ESTADO: Record<TicketEstado, { label: string; cls: string }> = {
  Nuevo:     { label: 'Nuevo',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  EnProceso: { label: 'En Proceso', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  EnEspera:  { label: 'En Espera',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Resuelto:  { label: 'Resuelto',   cls: 'bg-green-50 text-green-700 border-green-200' },
  Cerrado:   { label: 'Cerrado',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const PRIORIDAD: Record<TicketPrioridad, { label: string; cls: string }> = {
  Baja:    { label: 'Baja',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  Media:   { label: 'Media',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  Alta:    { label: 'Alta',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Critica: { label: 'Crítica', cls: 'bg-red-50 text-red-700 border-red-200' },
}

export function StatusBadge({ estado }: { estado: TicketEstado }) {
  const c = ESTADO[estado] ?? { label: estado, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  return <Badge className={`${SOFT} ${c.cls}`}>{c.label}</Badge>
}

export function PriorityBadge({ prioridad }: { prioridad: TicketPrioridad }) {
  const c = PRIORIDAD[prioridad] ?? { label: prioridad, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  return <Badge className={`${SOFT} ${c.cls}`}>{c.label}</Badge>
}
