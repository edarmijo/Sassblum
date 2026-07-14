import { useState } from 'react'
import { useTicketsList } from '../../hooks/useTickets'
import { TicketCard } from '../../components/TicketCard'
import { Reveal, FocusReveal } from '../../../../core/ui/motion'
import type { TicketEstado, TicketPrioridad, TicketFilterOptions } from '../../interfaces/ITicketService'

const ESTADOS: TicketEstado[] = ['Nuevo', 'EnProceso', 'EnEspera', 'Resuelto', 'Cerrado']
const PRIORIDADES: TicketPrioridad[] = ['Baja', 'Media', 'Alta', 'Critica']

interface TicketHistoryPageProps {
  onSelectTicket?: (id: string) => void
}

/**
 * SRP: lists the user's tickets with filters. Reuses TicketCard (S17).
 * DIP: data via useTicketsList (ITicketClientActions through Context).
 * OCP: new filter → add a control + a key in TicketFilterOptions; list logic unchanged.
 */
export function TicketHistoryPage({ onSelectTicket }: Readonly<TicketHistoryPageProps>) {
  const [filters, setFilters] = useState<TicketFilterOptions>({})
  const { tickets, isLoading, error } = useTicketsList(filters)

  const setFilter = (key: keyof TicketFilterOptions, value: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (value) next[key] = value as never
      else delete next[key]
      return next
    })
  }

  return (
    <section className="space-y-5">
      <Reveal y={16}>
        <header>
          <h2 className="text-xl font-bold text-foreground">Historial de tickets</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Consulta y filtra tus solicitudes.</p>
        </header>
      </Reveal>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Filtrar por estado"
          onChange={(e) => setFilter('estado', e.target.value)}
          className="rounded-lg border border-input bg-input-background text-foreground px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <select
          aria-label="Filtrar por prioridad"
          onChange={(e) => setFilter('prioridad', e.target.value)}
          className="rounded-lg border border-input bg-input-background text-foreground px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          <option value="">Todas las prioridades</option>
          {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* List */}
      {isLoading && <p className="text-sm text-muted-foreground">Cargando tickets…</p>}
      {error && (
        <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {!isLoading && !error && tickets.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay tickets que coincidan.</p>
      )}
      {!isLoading && !error && tickets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tickets.map((t, i) => (
            <FocusReveal key={t.id} delay={Math.min(i * 0.06, 0.36)}>
              <TicketCard ticket={t} onSelect={onSelectTicket} />
            </FocusReveal>
          ))}
        </div>
      )}
    </section>
  )
}
