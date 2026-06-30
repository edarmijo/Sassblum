import { useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { ITicketClientActions } from '../interfaces/ITicketClientActions'
import type {
  TicketDetail,
  TicketSummary,
  TicketFilterOptions,
  TicketCreatePayload,
} from '../interfaces/ITicketService'

// ── DIP: service delivered via Context, never imported directly ───────────────

export const TicketClientContext = createContext<ITicketClientActions | null>(null)

function useTicketService(): ITicketClientActions {
  const service = useContext(TicketClientContext)
  if (!service) {
    throw new Error(
      'useTickets must be used inside <TicketClientProvider>. ' +
      'Wrap your route tree with the provider and inject an ITicketClientActions instance.'
    )
  }
  return service
}

interface TicketClientProviderProps {
  service: ITicketClientActions
  children: ReactNode
}

export function TicketClientProvider({ service, children }: TicketClientProviderProps) {
  return (
    <TicketClientContext.Provider value={service}>
      {children}
    </TicketClientContext.Provider>
  )
}

// ── Hook: list + create ───────────────────────────────────────────────────────

interface UseTicketsListResult {
  tickets: TicketSummary[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  createTicket: (payload: TicketCreatePayload) => Promise<TicketDetail>
}

export function useTicketsList(filters?: TicketFilterOptions): UseTicketsListResult {
  const service = useTicketService()
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const fetchTickets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await service.getMyTickets(filters)
      setTickets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tickets')
    } finally {
      setIsLoading(false)
    }
  }, [service, filtersKey])

  useEffect(() => { fetchTickets().catch(console.error) }, [fetchTickets])

  const createTicket = useCallback(
    async (payload: TicketCreatePayload): Promise<TicketDetail> => {
      const newTicket = await service.createTicket(payload)
      fetchTickets().catch(console.error)
      return newTicket
    },
    [service, fetchTickets],
  )

  return { tickets, isLoading, error, refresh: fetchTickets, createTicket }
}

// ── Hook: single ticket detail ────────────────────────────────────────────────

interface UseTicketDetailResult {
  ticket: TicketDetail | null
  isLoading: boolean
  error: string | null
}

export function useTicketDetail(ticketId: string): UseTicketDetailResult {
  const service = useTicketService()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await service.getTicketDetail(ticketId)
        if (!cancelled) setTicket(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el ticket')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load().catch(console.error)
    return () => { cancelled = true }
  }, [service, ticketId])

  return { ticket, isLoading, error }
}
