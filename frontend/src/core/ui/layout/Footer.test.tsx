import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Footer } from './Footer'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer', () => {
  it('keeps internal navigation inside the SPA', () => {
    renderFooter()

    expect(screen.getByRole('link', { name: /Sassblum, ir al inicio/i })).toHaveAttribute(
      'href',
      '/',
    )

    const serviceLinks = screen.getAllByRole('link', {
      name: /Infraestructura IT|Soporte Técnico|Cableado Estructurado|Sistema CCTV|Domótica|Servidores/i,
    })
    expect(serviceLinks).toHaveLength(6)
    expect(serviceLinks.every((link) => link.getAttribute('href') === '/servicios')).toBe(true)
  })

  it('exposes semantic navigation and contact destinations', () => {
    renderFooter()

    expect(screen.getByRole('navigation', { name: /Servicios/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /Más/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /info@sassblum.com/i })).toHaveAttribute(
      'href',
      'mailto:info@sassblum.com',
    )
    expect(screen.getByRole('link', { name: /593 96 999 0990/i })).toHaveAttribute(
      'href',
      'tel:+593969990990',
    )
  })
})
