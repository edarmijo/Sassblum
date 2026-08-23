import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './index'

const updateProfile = vi.hoisted(() => vi.fn(async (data: unknown) => data))

beforeAll(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
})

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1', email: 'cliente@example.com', nombre: 'Ana', apellido: 'Pérez',
      tipoIdentificacion: 'RUC', ruc: '', empresa: '', rol: 'CLIENTE',
      estado: 'ACTIVO', emailVerificado: true,
    },
    updateProfile,
  }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

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

describe('ProfilePage B3', () => {
  it('lets an existing incomplete client select cédula and complete the profile', async () => {
    updateProfile.mockClear()
    const user = userEvent.setup()
    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    await user.type(screen.getByLabelText(/^empresa$/i), 'Empresa Cliente')
    await user.selectOptions(screen.getByLabelText(/tipo de identificación/i), 'Cedula')
    await user.type(screen.getByLabelText(/^cédula$/i), '0912345678')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellido: 'Pérez',
      tipo_identificacion: 'Cedula',
      ruc: '0912345678',
      empresa: 'Empresa Cliente',
    }))
  })
})
