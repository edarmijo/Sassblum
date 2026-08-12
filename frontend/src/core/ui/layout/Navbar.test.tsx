import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Navbar } from './Navbar'

vi.mock('../../../modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isBootstrapping: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  }),
}))

describe('Navbar brand', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the complete Sass Blum name as an internal home link', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    const brand = screen.getByRole('link', { name: 'Sassblum, ir al inicio' })
    expect(brand).toHaveAttribute('href', '/')
    expect(brand).toHaveTextContent('SASSBLUM')
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveStyle({
      width: '44px',
      height: '44px',
    })
  })
})
