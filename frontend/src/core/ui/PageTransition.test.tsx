import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageTransition } from './PageTransition'

describe('PageTransition', () => {
  it('marks the keyed route surface for the compositor-only CSS entrance', () => {
    const { container, rerender } = render(
      <PageTransition pathname="/">
        <h1>Inicio</h1>
      </PageTransition>,
    )

    const initialSurface = container.firstElementChild
    expect(initialSurface).toHaveClass('route-enter')
    expect(initialSurface).toHaveAttribute('data-route-transition', '/')

    rerender(
      <PageTransition pathname="/servicios">
        <h1>Servicios</h1>
      </PageTransition>,
    )

    expect(screen.getByRole('heading', { name: 'Servicios' })).toBeInTheDocument()
    expect(container.firstElementChild).not.toBe(initialSurface)
    expect(container.firstElementChild).toHaveAttribute(
      'data-route-transition',
      '/servicios',
    )
  })
})
