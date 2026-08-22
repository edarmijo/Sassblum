import type { PropsWithChildren } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TicketDetail } from '../../interfaces/ITicketService'

const { session, useTicketDetailMock } = vi.hoisted(() => ({
  session: { role: 'ADMINISTRADOR' },
  useTicketDetailMock: vi.fn(),
}))

vi.mock('../../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { rol: session.role } }),
}))

vi.mock('../../hooks/useTickets', () => ({
  useTicketDetail: useTicketDetailMock,
}))

vi.mock('../../components/TicketDetail', () => ({
  TicketDetail: () => <div>Detalle del ticket</div>,
}))

vi.mock('../../components/ContactEditForm', () => ({
  ContactEditForm: () => <div>Formulario de contacto administrativo</div>,
}))

vi.mock('../../components/StatusChangeForm', () => ({
  StatusChangeForm: () => <div>Cambio de estado</div>,
}))

vi.mock('../../components/AssignModal', () => ({
  AssignModal: () => <div>Asignación</div>,
}))

vi.mock('../../../../core/ui/layout/BackBar', () => ({
  BackBar: () => <div>Volver</div>,
}))

vi.mock('../../../../core/ui/motion', () => ({
  Reveal: ({ children }: PropsWithChildren) => <>{children}</>,
  FocusReveal: ({ children }: PropsWithChildren) => <>{children}</>,
}))

import { TicketDetailPage } from './index'

const ticket: TicketDetail = {
  id: '10',
  numero: 'T-2026-0010',
  asunto: 'Incidente',
  estado: 'Nuevo',
  prioridad: 'Media',
  servicioNombre: 'Soporte',
  creadoEn: '2026-08-10T15:00:00Z',
  descripcion: 'Detalle',
  clienteNombre: 'Cliente',
  clienteEmail: 'cliente@example.com',
  clienteRuc: '0999999999001',
  clienteEmpresa: 'Empresa',
  asignadoNombre: null,
  adjuntos: [],
  eventos: [],
  actualizadoEn: '2026-08-10T15:00:00Z',
}

describe('TicketDetailPage contact permissions', () => {
  beforeEach(() => {
    useTicketDetailMock.mockReturnValue({
      ticket,
      isLoading: false,
      error: null,
      replaceTicket: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the contact correction form to administrators', () => {
    session.role = 'ADMINISTRADOR'
    render(<TicketDetailPage ticketId="10" />)

    expect(screen.getByText('Formulario de contacto administrativo')).toBeInTheDocument()
  })

  it.each(['CLIENTE', 'TRABAJADOR'])('hides the contact form from %s', (role) => {
    session.role = role
    render(<TicketDetailPage ticketId="10" />)

    expect(screen.queryByText('Formulario de contacto administrativo')).not.toBeInTheDocument()
  })
})
