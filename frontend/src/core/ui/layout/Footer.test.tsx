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
    expect(screen.getByRole('link', { name: /593 99 528 6319/i })).toHaveAttribute(
      'href',
      'tel:+593995286319',
    )
    expect(screen.getByText('Guayaquil - Ecuador')).toBeInTheDocument()
  })

  it('restores the three legacy social destinations securely', () => {
    renderFooter()

    const socialLinks = [
      {
        name: /Facebook.*pestaña nueva/i,
        href: 'https://www.facebook.com/sass.blum/',
      },
      {
        name: /LinkedIn.*pestaña nueva/i,
        href: 'https://www.linkedin.com/in/sassblum-consultor%C3%ADa-seguridad-inform%C3%A1tica-ab7a72165',
      },
      {
        name: /Instagram.*pestaña nueva/i,
        href: 'https://www.instagram.com/sassblum/',
      },
    ]

    for (const expected of socialLinks) {
      const link = screen.getByRole('link', { name: expected.name })
      expect(link).toHaveAttribute('href', expected.href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('does not render the former design credit', () => {
    renderFooter()

    expect(screen.queryByText(/Diseñado con/i)).not.toBeInTheDocument()
  })
})
