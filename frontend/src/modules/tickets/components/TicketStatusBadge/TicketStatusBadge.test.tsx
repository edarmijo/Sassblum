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

  const STYLE_CASES: Array<[TicketEstado, string[]]> = [
    ['Nuevo',     ['bg-blue-50', 'text-blue-700']],
    ['EnProceso', ['bg-cyan-50']],
    ['Resuelto',  ['bg-green-50']],
    ['Cerrado',   ['bg-slate-100']],
  ]

  it.each(STYLE_CASES)('renders "%s" with its styling classes', (estado, classes) => {
    const { container } = render(<TicketStatusBadge estado={estado} />)
    const badge = container.firstChild as HTMLElement
    for (const cls of classes) expect(badge).toHaveClass(cls)
  })

  it('includes aria-label with estado', () => {
    render(<TicketStatusBadge estado="EnEspera" />)
    expect(screen.getByLabelText(/en espera/i)).toBeInTheDocument()
  })
})
