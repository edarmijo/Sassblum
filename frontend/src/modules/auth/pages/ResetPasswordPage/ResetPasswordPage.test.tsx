import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ResetPasswordPage } from './index'

const resetPassword = vi.hoisted(() => vi.fn())
const logout = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/useAuthService', () => ({
  useAuthService: () => ({ resetPassword }),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ logout }),
}))

describe('ResetPasswordPage shared policy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logout.mockResolvedValue(undefined)
  })

  it('rejects letters-only passwords consistently with registration and B11', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage token="reset-token" />)

    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'SoloLetras')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'SoloLetras')
    await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/letra y un número/i)
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('submits a value that meets the shared policy', async () => {
    resetPassword.mockResolvedValueOnce({ message: 'ok' })
    const user = userEvent.setup()
    render(<ResetPasswordPage token="reset-token" />)

    await user.type(screen.getByLabelText(/^nueva contraseña$/i), 'Nueva123')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Nueva123')
    await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }))

    expect(resetPassword).toHaveBeenCalledWith('reset-token', 'Nueva123', 'Nueva123')
    expect(logout).toHaveBeenCalledOnce()
    expect(await screen.findByText(/contraseña actualizada/i)).toBeInTheDocument()
  })
})
