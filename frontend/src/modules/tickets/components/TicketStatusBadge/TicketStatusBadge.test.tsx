import { render, screen } from '@testing-library/react'
import { TicketStatusBadge } from './index'
import type { TicketEstado } from '../../interfaces/ITicketService'

const STATES: TicketEstado[] = ['Nuevo', 'EnProceso', 'EnEspera', 'Resuelto', 'Cerrado']

// Maps estado keys to the display labels used in aria-label ("Estado: {label}")
const LABEL_MAP: Record<TicketEstado, RegExp> = {
  Nuevo:     /nuevo/i,
  EnProceso: /en proceso/i,
  EnEspera:  /en espera/i,
  Resuelto:  /resuelto/i,
  Cerrado:   /cerrado/i,
}

describe('TicketStatusBadge', () => {
  it.each(STATES)('renders label for estado "%s"', (estado) => {
    render(<TicketStatusBadge estado={estado} />)
    const badge = screen.getByLabelText(LABEL_MAP[estado])
    expect(badge).toBeInTheDocument()
  })

  it('renders "Nuevo" with blue styling', () => {
    const { container } = render(<TicketStatusBadge estado="Nuevo" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-blue-50')
    expect(badge).toHaveClass('text-blue-700')
  })

  it('renders "Cerrado" with slate styling', () => {
    const { container } = render(<TicketStatusBadge estado="Cerrado" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-slate-100')
  })

  it('renders "EnProceso" with cyan styling', () => {
    const { container } = render(<TicketStatusBadge estado="EnProceso" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-cyan-50')
  })

  it('renders "Resuelto" with green styling', () => {
    const { container } = render(<TicketStatusBadge estado="Resuelto" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-green-50')
  })

  it('includes aria-label with estado', () => {
    render(<TicketStatusBadge estado="EnEspera" />)
    expect(screen.getByLabelText(/en espera/i)).toBeInTheDocument()
  })
})
