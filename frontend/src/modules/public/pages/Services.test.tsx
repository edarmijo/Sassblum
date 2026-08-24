import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { Services } from './Services'

const setFilters = vi.fn()
let authenticated = false

vi.mock('../../catalog/hooks/useCatalog', () => ({
  useCatalog: () => ({
    services: [
      {
        id: '12',
        nombre: 'Instalación Router',
        descripcion: 'Conectividad empresarial',
        descripcionDetalle: 'Instalación y configuración segura.',
        categoria: 'Redes',
        activo: true,
        imagenUrl: '',
        imagenes: [],
      },
    ],
    isLoading: false,
    error: null,
    setFilters,
  }),
}))

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: authenticated ? { id: '1', rol: 'CLIENTE' } : null,
  }),
}))

// Las capas de presentación usan APIs del navegador que jsdom no implementa
// (IntersectionObserver y matchMedia). Se sustituyen para probar únicamente el
// flujo funcional de búsqueda, detalle y destino del ticket.
vi.mock('../../../core/ui/motion', () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RevealGroup: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  RevealItem: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock('../../../core/ui/GlowCard', () => ({
  GlowCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock('../../../core/ui/layout/PageHero', () => ({
  PageHero: () => <div data-testid="page-hero" />,
}))

function renderServices() {
  return render(
    <MemoryRouter>
      <Services />
    </MemoryRouter>,
  )
}

describe('Services mobile ticket flow', () => {
  beforeEach(() => {
    authenticated = false
    setFilters.mockClear()
  })

  it('offers public search and category filters', async () => {
    renderServices()

    await userEvent.type(screen.getByLabelText('Buscar servicio'), 'router')
    expect(setFilters).toHaveBeenLastCalledWith({ busqueda: 'router', categoria: undefined })

    await userEvent.type(screen.getByLabelText('Categoría'), 'redes')
    expect(setFilters).toHaveBeenLastCalledWith({ busqueda: 'router', categoria: 'redes' })
  })

  it('preserves the selected service through the safe login destination', async () => {
    renderServices()
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalles de Instalación Router' }))

    expect(screen.getByRole('link', { name: 'Inicia sesión para solicitar' })).toHaveAttribute(
      'href',
      '/login?next=%2Fmis-tickets%3Ftab%3Dcreate%26servicio%3D12',
    )
  })

  it('opens ticket creation directly for an authenticated client', async () => {
    authenticated = true
    renderServices()
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalles de Instalación Router' }))

    expect(screen.getByRole('link', { name: 'Solicitar servicio' })).toHaveAttribute(
      'href',
      '/mis-tickets?tab=create&servicio=12',
    )
  })
})
