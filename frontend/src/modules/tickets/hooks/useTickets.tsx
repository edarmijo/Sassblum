import { useState, useEffect, useCallback, useContext, createContext, useMemo, useRef } from 'react'
import type { ITicketClientActions } from '../interfaces/ITicketClientActions'
import type {
  TicketDetail,
  TicketSummary,
  TicketFilterOptions,
  TicketCreatePayload,
} from '../interfaces/ITicketService'

// ── DIP: service delivered via Context, never imported directly ───────────────
// El componente TicketClientProvider vive en TicketClientProvider.tsx (Fast Refresh).

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

// ── Hook: list + create ───────────────────────────────────────────────────────

interface UseTicketsListResult {
  tickets: TicketSummary[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  createTicket: (payload: TicketCreatePayload) => Promise<TicketDetail>
}

/** Mutation-only hook: creating a ticket must not fetch the full ticket list. */
export function useCreateTicket() {
  const service = useTicketService()
  return useCallback(
    (payload: TicketCreatePayload): Promise<TicketDetail> => service.createTicket(payload),
    [service],
  )
}

export function useTicketsList(filters?: TicketFilterOptions): UseTicketsListResult {
  const service = useTicketService()
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const hasStartedRef = useRef(false)
  const invalidateRequests = useCallback(() => { requestIdRef.current++ }, [])

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const fetchTickets = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      // Se reconstruye desde la clave serializada: deps exactas sin re-fetch
      // por identidad de objeto (react-hooks/exhaustive-deps).
      const parsed: TicketFilterOptions = JSON.parse(filtersKey)
      const data = await service.getMyTickets(parsed)
      if (requestId === requestIdRef.current) setTickets(data)
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Error al cargar tickets')
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [service, filtersKey])

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      fetchTickets().catch(console.error)
      return invalidateRequests
    }

    requestIdRef.current++
    const timeoutId = globalThis.setTimeout(() => fetchTickets().catch(console.error), 350)
    return () => {
      globalThis.clearTimeout(timeoutId)
      invalidateRequests()
    }
  }, [fetchTickets, invalidateRequests])

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
  refresh: () => Promise<void>
  replaceTicket: (ticket: TicketDetail) => void
}

export function useTicketDetail(ticketId: string): UseTicketDetailResult {
  const service = useTicketService()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const invalidateRequests = useCallback(() => { requestIdRef.current++ }, [])

  const load = useCallback(async () => {
      const requestId = ++requestIdRef.current
      setIsLoading(true)
      setError(null)
      try {
        const data = await service.getTicketDetail(ticketId)
        if (requestId === requestIdRef.current) setTicket(data)
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Error al cargar el ticket')
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false)
      }
  }, [service, ticketId])

  useEffect(() => {
    load().catch(console.error)
    return invalidateRequests
  }, [load, invalidateRequests])

  const replaceTicket = useCallback((nextTicket: TicketDetail) => {
    invalidateRequests()
    setTicket(nextTicket)
    setError(null)
    setIsLoading(false)
  }, [invalidateRequests])

  return { ticket, isLoading, error, refresh: load, replaceTicket }
}
