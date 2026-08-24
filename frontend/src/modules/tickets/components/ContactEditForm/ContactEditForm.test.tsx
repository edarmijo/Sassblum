import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TicketDetail } from '../../interfaces/ITicketService'
import { ContactEditForm } from './index'

const ticket: TicketDetail = {
  id: '10',
  numero: 'T-2026-0010',
  asunto: 'Incidente de red',
  estado: 'EnProceso',
  prioridad: 'Alta',
  servicioNombre: 'Soporte',
  creadoEn: '2026-08-10T15:00:00Z',
  descripcion: 'Sin conectividad.',
  clienteNombre: 'Nombre Original',
  clienteEmail: 'original@example.com',
  clienteRuc: '0999999999001',
  clienteEmpresa: 'Empresa de prueba',
  asignadoNombre: null,
  puedeModificar: true,
  adjuntos: [],
  eventos: [],
  actualizadoEn: '2026-08-10T15:00:00Z',
}

describe('ContactEditForm', () => {
  it('submits only the editable name and email while showing company and RUC read-only', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ContactEditForm ticket={ticket} onSubmit={onSubmit} />)

    expect(screen.getByLabelText('Empresa')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('RUC / identificación')).toHaveAttribute('readonly')

    fireEvent.change(screen.getByLabelText('Nombre del contacto'), {
      target: { value: 'Nombre Corregido' },
    })
    fireEvent.change(screen.getByLabelText('Correo del contacto'), {
      target: { value: 'correcto@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar corrección' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Nombre Corregido',
      email: 'correcto@example.com',
    }))
  })
})
