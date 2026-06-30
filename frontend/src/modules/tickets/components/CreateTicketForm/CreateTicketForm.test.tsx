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
    run(_data: unknown) {
      return { isValid: true, field: '', errors: [] as string[] }
    }
  },
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

function renderForm(service: ITicketClientActions, onSuccess = vi.fn()) {
  return render(
    <TicketClientContext.Provider value={service}>
      <CreateTicketForm services={SERVICES} onSuccess={onSuccess} />
    </TicketClientContext.Provider>
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CreateTicketForm', () => {
  describe('field rendering', () => {
    it('renders all required fields', () => {
      renderForm(makeService())
      expect(screen.getByLabelText(/asunto/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/servicio/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /crear ticket/i })).toBeInTheDocument()
    })

    it('renders service options', () => {
      renderForm(makeService())
      expect(screen.getByRole('option', { name: /soporte técnico/i })).toBeInTheDocument()
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

    it('calls onSuccess with the new ticket id', async () => {
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
        expect(onSuccess).toHaveBeenCalledWith(mockTicket.id)
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
