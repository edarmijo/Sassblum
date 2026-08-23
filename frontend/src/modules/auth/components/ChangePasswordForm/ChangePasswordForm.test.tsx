import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChangePasswordForm } from './index'

const changePassword = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ changePassword }),
}))

vi.mock('sonner', () => ({ toast: { success: toastSuccess } }))

describe('ChangePasswordForm B11', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses accessible password semantics and explains the shared policy', () => {
    render(<ChangePasswordForm />)

    expect(screen.getByLabelText(/contraseña actual/i)).toHaveAttribute(
      'autocomplete',
      'current-password',
    )
    expect(screen.getByLabelText(/^nueva contraseña$/i)).toHaveAttribute(
      'autocomplete',
      'new-password',
    )
    expect(screen.getByText(/mínimo 8 caracteres, con al menos una letra y un número/i))
      .toBeInTheDocument()
  })

  it('rejects a value without a number before contacting the backend', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.type(screen.getByLabelText(/contraseña actual/i), 'Actual123')
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'SoloLetras')
    await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'SoloLetras')
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }))

    const current = screen.getByLabelText(/contraseña actual/i)
    const newPassword = screen.getByLabelText(/^nueva contraseña$/i)
    const confirmation = screen.getByLabelText(/confirmar nueva contraseña/i)
    expect(await screen.findByRole('alert')).toHaveTextContent(/letra y un número/i)
    expect(newPassword).toHaveAttribute('aria-invalid', 'true')
    expect(newPassword).toHaveAttribute(
      'aria-describedby',
      'password-policy profile-new-password-error',
    )
    expect(current).not.toHaveAttribute('aria-invalid')
    expect(confirmation).not.toHaveAttribute('aria-invalid')
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('associates a confirmation error only with its field', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.type(screen.getByLabelText(/contraseña actual/i), 'Actual123')
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'Nueva456')
    await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'Distinta789')
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }))

    const confirmation = screen.getByLabelText(/confirmar nueva contraseña/i)
    expect(await screen.findByRole('alert')).toHaveTextContent(/no coinciden/i)
    expect(confirmation).toHaveAttribute('aria-invalid', 'true')
    expect(confirmation).toHaveAttribute('aria-describedby', 'profile-confirm-password-error')
    expect(screen.getByLabelText(/contraseña actual/i)).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(/^nueva contraseña$/i)).not.toHaveAttribute('aria-invalid')
  })

  it('associates the backend current-password error without invalidating other fields', async () => {
    changePassword.mockRejectedValueOnce(new Error('La contraseña actual es incorrecta.'))
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.type(screen.getByLabelText(/contraseña actual/i), 'Incorrecta123')
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'Nueva456')
    await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'Nueva456')
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }))

    const current = screen.getByLabelText(/contraseña actual/i)
    expect(await screen.findByRole('alert')).toHaveTextContent(/actual es incorrecta/i)
    expect(current).toHaveAttribute('aria-invalid', 'true')
    expect(current).toHaveAttribute('aria-describedby', 'current-password-error')
    expect(screen.getByLabelText(/^nueva contraseña$/i)).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(/confirmar nueva contraseña/i)).not.toHaveAttribute('aria-invalid')
  })

  it('submits through useAuth and reports successful forced sign-out', async () => {
    changePassword.mockResolvedValueOnce({ message: 'Contraseña actualizada.' })
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.type(screen.getByLabelText(/contraseña actual/i), 'Actual123')
    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'Nueva456')
    await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'Nueva456')
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }))

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'Actual123',
      newPassword: 'Nueva456',
      confirmPassword: 'Nueva456',
    }))
    expect(toastSuccess).toHaveBeenCalledWith('Contraseña actualizada.')
  })
})
