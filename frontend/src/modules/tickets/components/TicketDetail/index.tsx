import { Paperclip } from 'lucide-react'
import { useTicketDetail } from '../../hooks/useTickets'
import { TicketStatusBadge } from '../TicketStatusBadge'
import { TicketHistory } from '../TicketHistory'

interface TicketDetailProps {
  ticketId: string
}

function MetaField({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <span className="text-xs font-medium text-[#5c7a94] uppercase tracking-wide">{label}</span>
      <p className="mt-0.5 text-[#eef4f8]">{children}</p>
    </div>
  )
}

/**
 * SRP: renders full detail of one ticket including history.
 * DIP: loads data via useTicketDetail which depends on ITicketClientActions (Context).
 * OCP: new section (e.g. adjuntos list) → add below the grid without touching other sections.
 */
export function TicketDetail({ ticketId }: Readonly<TicketDetailProps>) {
  const { ticket, isLoading, error } = useTicketDetail(ticketId)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 rounded w-1/3" style={{ background: 'rgba(0,196,224,0.1)' }} />
        <div className="h-4 rounded w-2/3" style={{ background: 'rgba(0,196,224,0.08)' }} />
        <div className="h-20 rounded" style={{ background: 'rgba(0,196,224,0.06)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!ticket) return null

  return (
    <article className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-mono text-[#5c7a94] tracking-wide">{ticket.numero}</p>
          <h2 className="text-xl font-bold text-[#eef4f8] mt-1 leading-snug">
            {ticket.asunto}
          </h2>
          <p className="text-sm text-[#5c7a94] mt-1">{ticket.servicioNombre}</p>
        </div>
        <TicketStatusBadge estado={ticket.estado} />
      </div>

      {/* Description */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5c7a94] mb-2">
          Descripción
        </h3>
        <p className="text-sm text-[#eef4f8]/90 whitespace-pre-wrap leading-relaxed">
          {ticket.descripcion}
        </p>
      </section>

      {/* Metadata grid */}
      <section className="grid grid-cols-2 gap-4 text-sm rounded-lg p-4" style={{ background: 'rgba(0,196,224,0.06)', border: '1px solid rgba(0,196,224,0.12)' }}>
        <MetaField label="Cliente">{ticket.clienteNombre}</MetaField>
        <MetaField label="Asignado a">
          {ticket.asignadoNombre ?? <span className="italic text-[#5c7a94]">Sin asignar</span>}
        </MetaField>
        <MetaField label="Prioridad">{ticket.prioridad}</MetaField>
        <MetaField label="Creado">
          {new Date(ticket.creadoEn).toLocaleDateString('es-EC', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </MetaField>
      </section>

      {/* Attachments */}
      {ticket.adjuntos.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5c7a94] mb-2">
            Adjuntos ({ticket.adjuntos.length})
          </h3>
          <ul className="space-y-2">
            {ticket.adjuntos.map((att) => (
              <li key={att.id}>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-cyan-dark font-medium hover:underline"
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span>{att.nombreArchivo}</span>
                  <span className="text-[#5c7a94] text-xs font-normal">
                    ({(att.tamañoBytes / 1024).toFixed(0)} KB)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* History */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5c7a94] mb-3">
          Historial de eventos
        </h3>
        <TicketHistory events={ticket.eventos} />
      </section>
    </article>
  )
}
