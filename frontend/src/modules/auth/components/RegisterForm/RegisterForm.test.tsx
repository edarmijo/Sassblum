import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RegisterForm } from './index'

const registerMock = vi.hoisted(() => vi.fn(async () => ({ message: 'Cuenta creada.' })))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ register: registerMock }),
}))

vi.mock('../../../../core/ui/select', () => ({
  Select: ({ value, onValueChange, children }: {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
  }) => (
    <select
      aria-label="Tipo de identificación"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
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

describe('RegisterForm B3', () => {
  it('updates help and clears a stale identification error when type changes', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    await user.type(screen.getByLabelText(/^empresa$/i), 'Empresa')
    await user.type(screen.getByLabelText(/^ruc$/i), '123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/13 dígitos/i)

    await user.selectOptions(screen.getByLabelText(/tipo de identificación/i), 'Cedula')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^cédula$/i)).toHaveAttribute('maxlength', '10')
    expect(screen.getByText(/exactamente 10 dígitos/i)).toBeInTheDocument()
  })

  it('submits required company and a valid selected cédula', async () => {
    registerMock.mockClear()
    const user = userEvent.setup()
    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    await user.type(screen.getByLabelText(/^nombre$/i), 'Ana')
    await user.type(screen.getByLabelText(/^apellido$/i), 'Pérez')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/^empresa$/i), 'Empresa')
    await user.selectOptions(screen.getByLabelText(/tipo de identificación/i), 'Cedula')
    await user.type(screen.getByLabelText(/^cédula$/i), '0912345678')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Clave1234')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Clave1234')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({
      tipoIdentificacion: 'Cedula',
      ruc: '0912345678',
      empresa: 'Empresa',
    })))
  })
})
