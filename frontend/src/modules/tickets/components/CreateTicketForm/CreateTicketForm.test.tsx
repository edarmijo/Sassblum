import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CreateTicketForm } from './index'
import { TicketClientContext } from '../../hooks/useTickets'
import type { ITicketClientActions } from '../../interfaces/ITicketClientActions'
import type { TicketDetail } from '../../interfaces/ITicketService'

// Mock the validator chain so tests are time-independent (BusinessRuleValidator checks business hours)
vi.mock('../../validators/TicketValidatorChain', () => ({
  TicketValidatorChain: class {
    run() {
      return { isValid: true, field: '', errors: [] as string[] }
    }
  },
}))

// El Select real es Radix (portales + pointer events) y no funciona en jsdom con
// userEvent.selectOptions; se sustituye por un <select> nativo equivalente para
// testear la lógica del formulario, no la librería de UI.
vi.mock('../../../../core/ui/select', () => ({
  Select: ({ value, onValueChange, children }: {
    value: string
    onValueChange: (v: string) => void
    children: React.ReactNode
  }) => (
    <select
      aria-label="Servicio"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">Selecciona un servicio…</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

// El formulario usa useAuth (autocompleta datos del cliente, H#7); se mockea para
// no montar el AuthProvider completo (localStorage, ApiClient, SocketClient).
vi.mock('../../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1', nombre: 'Cliente', apellido: 'Test',
      email: 'cliente@test.com', ruc: '', rol: 'CLIENTE',
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}))

// ── Mock service ───────────────────────────────────────────────────────────────

const mockTicket: TicketDetail = {
  id: '1',
  numero: 'T-2026-0001',
  asunto: 'Test asunto',
  descripcion: 'Test descripcion que es suficientemente larga.',
  estado: 'Nuevo',
  prioridad: 'Media',
  servicioNombre: 'Soporte técnico',
  clienteNombre: 'Cliente Test',
  asignadoNombre: null,
  adjuntos: [],
  eventos: [],
  creadoEn: new Date().toISOString(),
  actualizadoEn: new Date().toISOString(),
}

function makeService(overrides: Partial<ITicketClientActions> = {}): ITicketClientActions {
  return {
    createTicket: vi.fn().mockResolvedValue(mockTicket),
    getMyTickets: vi.fn().mockResolvedValue([]),
    getTicketDetail: vi.fn().mockResolvedValue(mockTicket),
    ...overrides,
  }
}

const SERVICES = [{ id: '1', nombre: 'Soporte técnico' }]

function renderForm(service: ITicketClientActions, onSuccess = vi.fn(), initialServiceId?: string) {
  return render(
    <TicketClientContext.Provider value={service}>
      <CreateTicketForm services={SERVICES} initialServiceId={initialServiceId} onSuccess={onSuccess} />
    </TicketClientContext.Provider>
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CreateTicketForm', () => {
  describe('field rendering', () => {
    it('renders all required fields', () => {
      const service = makeService()
      renderForm(service)
      expect(screen.getByLabelText(/asunto/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/servicio/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /crear ticket/i })).toBeInTheDocument()
      expect(service.getMyTickets).not.toHaveBeenCalled()
    })

    it('renders service options', () => {
      renderForm(makeService())
      expect(screen.getByRole('option', { name: /soporte técnico/i })).toBeInTheDocument()
    })

    it('preselects a valid service received from the public catalog', () => {
      renderForm(makeService(), vi.fn(), '1')
      expect(screen.getByLabelText(/servicio/i)).toHaveValue('1')
    })

    it('renders all priority options', () => {
      renderForm(makeService())
      expect(screen.getByRole('radio', { name: 'Baja' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Media' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Alta' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Critica' })).toBeInTheDocument()
    })
  })

  describe('client-side validation', () => {
    it('shows error when no service is selected', async () => {
      renderForm(makeService())
      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('shows asunto character count', async () => {
      renderForm(makeService())
      const asuntoInput = screen.getByLabelText(/asunto/i)
      await userEvent.type(asuntoInput, 'Hola')
      expect(screen.getByText('4/80')).toBeInTheDocument()
    })

    it('does not call createTicket when servicio is not selected', async () => {
      const service = makeService()
      renderForm(service)
      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))
      expect(service.createTicket).not.toHaveBeenCalled()
    })
  })

  describe('successful submission', () => {
    it('calls createTicket with correct payload', async () => {
      const service = makeService()
      const onSuccess = vi.fn()
      renderForm(service, onSuccess)

      await userEvent.type(screen.getByLabelText(/asunto/i), 'Problema con factura')
      await userEvent.type(
        screen.getByLabelText(/descripción/i),
        'No puedo descargar la factura del mes de mayo.'
      )
      await userEvent.selectOptions(screen.getByLabelText(/servicio/i), '1')

      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))

      await waitFor(() => {
        expect(service.createTicket).toHaveBeenCalledWith(
          expect.objectContaining({
            asunto: 'Problema con factura',
            servicioId: '1',
          })
        )
      })
    })

    it('calls onSuccess with the new ticket id and numero', async () => {
      const service = makeService()
      const onSuccess = vi.fn()
      renderForm(service, onSuccess)

      await userEvent.type(screen.getByLabelText(/asunto/i), 'Problema con factura')
      await userEvent.type(
        screen.getByLabelText(/descripción/i),
        'Descripción suficientemente larga para pasar validación.'
      )
      await userEvent.selectOptions(screen.getByLabelText(/servicio/i), '1')
      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))

      await waitFor(() => {
        // El componente entrega (id, numero): el numero alimenta el toast de éxito.
        expect(onSuccess).toHaveBeenCalledWith(mockTicket.id, mockTicket.numero)
      })
    })
  })

  describe('error handling', () => {
    it('shows error message when createTicket rejects', async () => {
      const service = makeService({
        createTicket: vi.fn().mockRejectedValue(new Error('Error de servidor')),
      })
      renderForm(service)

      await userEvent.type(screen.getByLabelText(/asunto/i), 'Problema con factura')
      await userEvent.type(
        screen.getByLabelText(/descripción/i),
        'Descripción suficientemente larga.'
      )
      await userEvent.selectOptions(screen.getByLabelText(/servicio/i), '1')
      await userEvent.click(screen.getByRole('button', { name: /crear ticket/i }))

      await waitFor(() => {
        expect(screen.getByText(/error de servidor/i)).toBeInTheDocument()
      })
    })
  })
})
