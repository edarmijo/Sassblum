import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { CreateTicketPage } from './index'

const createTicketForm = vi.fn()

vi.mock('../../../catalog/hooks/useCatalog', () => ({
  useCatalog: () => ({
    services: [{ id: '12', nombre: 'Instalación Router' }],
    isLoading: false,
  }),
}))

vi.mock('../../components/CreateTicketForm', () => ({
  CreateTicketForm: (props: { initialServiceId?: string }) => {
    createTicketForm(props)
    return <div data-testid="ticket-form">{props.initialServiceId ?? 'sin servicio'}</div>
  },
}))

describe('CreateTicketPage catalog continuity', () => {
  beforeEach(() => createTicketForm.mockClear())

  it('passes a valid requested service to the form', () => {
    render(
      <MemoryRouter initialEntries={['/mis-tickets?tab=create&servicio=12']}>
        <CreateTicketPage />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('ticket-form')).toHaveTextContent('12')
  })

  it('rejects an unavailable service and asks the client to choose another', () => {
    render(
      <MemoryRouter initialEntries={['/mis-tickets?tab=create&servicio=999']}>
        <CreateTicketPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('ya no está disponible')
    expect(screen.getByTestId('ticket-form')).toHaveTextContent('sin servicio')
  })
})
