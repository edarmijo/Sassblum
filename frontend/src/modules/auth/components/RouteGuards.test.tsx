import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isBootstrapping: true,
  user: null as { rol: 'CLIENTE' } | null,
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => authState,
}))

afterEach(() => {
  cleanup()
  authState.isAuthenticated = false
  authState.isBootstrapping = true
  authState.user = null
})

describe('authentication route boundaries', () => {
  it('shows an explicit local fallback while a protected route restores the session', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Contenido privado</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Restaurando tu sesión')
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('shows the same local fallback on guest-only routes without rendering their form early', () => {
    render(
      <MemoryRouter>
        <PublicRoute>
          <div>Formulario de acceso</div>
        </PublicRoute>
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Restaurando tu sesión')
    expect(screen.queryByText('Formulario de acceso')).not.toBeInTheDocument()
  })

  it('redirects a guest only after restoration has finished', () => {
    authState.isBootstrapping = false

    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route path="/privado" element={<ProtectedRoute><div>Privado</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Página de acceso</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Página de acceso')).toBeInTheDocument()
  })

  it('renders protected content after a valid session is restored', () => {
    authState.isBootstrapping = false
    authState.isAuthenticated = true
    authState.user = { rol: 'CLIENTE' }

    render(
      <MemoryRouter>
        <ProtectedRoute roles={['CLIENTE']}>
          <div>Contenido privado</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})
