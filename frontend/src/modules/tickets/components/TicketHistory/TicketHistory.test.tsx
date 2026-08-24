import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TicketEvent } from '../../interfaces/ITicketService'
import { TicketHistory } from './index'

const contactUpdatedEvent: TicketEvent = {
  id: '50',
  tipoEvento: 'contacto_actualizado',
  estadoAnterior: null,
  estadoNuevo: null,
  comentario: 'Contacto corregido por administración.',
  autorNombre: 'Administración',
  creadoEn: '2026-08-22T18:00:00Z',
}

describe('TicketHistory event labels', () => {
  it('shows a readable label for a contact correction event', () => {
    render(<TicketHistory events={[contactUpdatedEvent]} />)

    expect(screen.getByText('Contacto actualizado')).toBeInTheDocument()
    expect(screen.queryByText('contacto_actualizado')).not.toBeInTheDocument()
  })
})
