import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BackLink } from './BackLink'

/** Muestra la ruta activa para poder afirmar a dónde llevó el retorno. */
function Probe() {
  const { pathname, search } = useLocation()
  return <p data-testid="ruta">{`${pathname}${search}`}</p>
}

function renderAt(entries: Parameters<typeof MemoryRouter>[0]['initialEntries']) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={(entries?.length ?? 1) - 1}>
      <Probe />
      <Routes>
        <Route path="/admin" element={<p>Panel de admin</p>} />
        <Route
          path="/tickets/:id"
          element={<BackLink to="/admin" label="Volver a la administración" />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BackLink', () => {
  it('es un enlace real hacia el destino semántico', () => {
    renderAt(['/tickets/7'])

    expect(screen.getByRole('link', { name: 'Volver a la administración' }))
      .toHaveAttribute('href', '/admin')
  })

  it('lleva al destino semántico cuando se llegó por enlace directo', async () => {
    const user = userEvent.setup()
    renderAt(['/tickets/7'])

    await user.click(screen.getByRole('link', { name: 'Volver a la administración' }))

    expect(screen.getByTestId('ruta')).toHaveTextContent('/admin')
  })

  it('regresa a la vista de origen, con su pestaña y filtros, cuando fue sembrada', async () => {
    const user = userEvent.setup()
    renderAt([
      '/admin?tab=reports',
      { pathname: '/tickets/7', state: { from: '/admin?tab=reports' } },
    ])

    const link = screen.getByRole('link', { name: 'Volver a la administración' })
    expect(link).toHaveAttribute('href', '/admin?tab=reports')

    await user.click(link)

    expect(screen.getByTestId('ruta')).toHaveTextContent('/admin?tab=reports')
  })

  it('ignora un origen que apunta a la propia pantalla', () => {
    renderAt([{ pathname: '/tickets/7', state: { from: '/tickets/7' } }])

    expect(screen.getByRole('link', { name: 'Volver a la administración' }))
      .toHaveAttribute('href', '/admin')
  })

  it('descarta un origen externo (no permite redirección fuera del sitio)', () => {
    renderAt([{ pathname: '/tickets/7', state: { from: '//evil.example.com' } }])

    expect(screen.getByRole('link', { name: 'Volver a la administración' }))
      .toHaveAttribute('href', '/admin')
  })
})
