import type { TicketSummary } from '../../interfaces/ITicketService'
import { TicketStatusBadge } from '../TicketStatusBadge'

const PRIORITY_DOT: Record<string, string> = {
  Critica: 'bg-red-500',
  Alta:    'bg-amber-500',
  Media:   'bg-blue-500',
  Baja:    'bg-slate-400',
}

interface TicketCardProps {
  ticket: TicketSummary
  onSelect?: (id: string) => void
}

/**
 * SRP: renders a summary card for one ticket. No data fetching.
 * DIP: depends on TicketSummary type (from ITicketService), not on any concrete service.
 * OCP: new display field → extend TicketSummary + update this template; no structural change.
 */
export function TicketCard({ ticket, onSelect }: TicketCardProps) {
  const handleClick = () => onSelect?.(ticket.id)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(ticket.id)
    }
  }

  return (
    <article
      className="group bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-none"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ticket ${ticket.numero}: ${ticket.asunto}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono text-muted-foreground tracking-wide">
            {ticket.numero}
          </p>
          <h3 className="text-sm font-semibold text-foreground truncate mt-0.5 leading-snug group-hover:text-brand-cyan-dark transition-colors">
            {ticket.asunto}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 truncate">{ticket.servicioNombre}</p>
        </div>
        <TicketStatusBadge estado={ticket.estado} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <time className="text-xs text-muted-foreground">
          {new Date(ticket.creadoEn).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </time>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[ticket.prioridad] ?? 'bg-slate-400'}`} aria-hidden />
          {ticket.prioridad}
        </span>
      </div>
    </article>
  )
}
