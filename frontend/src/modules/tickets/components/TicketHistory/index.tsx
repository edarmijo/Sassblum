import { ArrowRight } from 'lucide-react'
import type { TicketEvent, TicketEstado } from '../../interfaces/ITicketService'
import { TicketStatusBadge } from '../TicketStatusBadge'

interface TicketHistoryProps {
  events: TicketEvent[]
}

const EVENT_LABELS: Record<string, string> = {
  creacion:      'Ticket creado',
  cambio_estado: 'Cambio de estado',
  comentario:    'Comentario',
  asignacion:    'Asignación',
  reasignacion:  'Reasignación',
  contacto_actualizado: 'Contacto actualizado',
}

/**
 * SRP: renders a timeline of TicketEvent records. No data fetching.
 * Receives events as props — TicketDetail is responsible for loading them.
 */
export function TicketHistory({ events }: Readonly<TicketHistoryProps>) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[#7aa3b8] italic">Sin historial de eventos.</p>
    )
  }

  return (
    <ol className="relative border-l-2 space-y-6 ml-2" style={{ borderColor: 'rgba(0,196,224,0.2)' }}>
      {events.map((event) => (
        <li key={event.id} className="ml-6">
          {/* Timeline dot */}
          <span className="absolute -left-1.75 mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand-cyan" style={{ boxShadow: '0 0 0 4px rgba(8,22,36,0.9)' }} />

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#eef4f8]">
                {EVENT_LABELS[event.tipoEvento] ?? event.tipoEvento}
              </span>

              {event.estadoAnterior && event.estadoNuevo && (
                <span className="flex items-center gap-1.5 text-xs text-[#7aa3b8]">
                  <TicketStatusBadge estado={event.estadoAnterior as TicketEstado} />
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  <TicketStatusBadge estado={event.estadoNuevo as TicketEstado} />
                </span>
              )}
            </div>

            <time className="text-xs text-[#7aa3b8]">
              {new Date(event.creadoEn).toLocaleString('es-EC', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' · '}
              <span className="font-medium text-[#eef4f8]/70">{event.autorNombre}</span>
            </time>

            {event.comentario && (
              <p className="text-sm text-[#eef4f8]/90 rounded-md px-3 py-2 mt-1" style={{ background: 'rgba(0,196,224,0.06)', border: '1px solid rgba(0,196,224,0.1)' }}>
                {event.comentario}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
