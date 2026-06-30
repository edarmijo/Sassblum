import type { TicketEstado } from '../../interfaces/ITicketService'

interface StatusConfig {
  label: string
  className: string
}

const STATUS_CONFIG: Record<TicketEstado, StatusConfig> = {
  Nuevo:     { label: 'Nuevo',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  EnProceso: { label: 'En Proceso', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  EnEspera:  { label: 'En Espera',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Resuelto:  { label: 'Resuelto',   className: 'bg-green-50 text-green-700 border-green-200' },
  Cerrado:   { label: 'Cerrado',    className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

interface TicketStatusBadgeProps {
  estado: TicketEstado
}

/**
 * SRP: renders a colored badge for a ticket state.
 * DIP: reads color config from STATUS_CONFIG — TicketStateMachine.TRANSITIONS
 *      can be cross-referenced here in Sprint 4 without modifying this component.
 * OCP: new state → new entry in STATUS_CONFIG; component unchanged.
 */
export function TicketStatusBadge({ estado }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[estado] ?? {
    label: estado,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      aria-label={`Estado: ${config.label}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {config.label}
    </span>
  )
}
