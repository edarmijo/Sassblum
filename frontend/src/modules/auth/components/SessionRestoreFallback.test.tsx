import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionRestoreFallback } from './SessionRestoreFallback'

describe('SessionRestoreFallback', () => {
  beforeEach(() => vi.useFakeTimers())

  afterEach(() => {
    vi.useRealTimers()
  })

  it('explains the session check instead of leaving an empty route', () => {
    render(
      <MemoryRouter>
        <SessionRestoreFallback />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Restaurando tu sesión')
    expect(screen.getByText('Estamos comprobando tu acceso de forma segura.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Volver al inicio' })).not.toBeInTheDocument()
  })

  it('offers a non-blocking exit when restoration is unusually slow', () => {
    render(
      <MemoryRouter>
        <SessionRestoreFallback />
      </MemoryRouter>,
    )

    act(() => vi.advanceTimersByTime(4_000))

    expect(screen.getByText(/tardando más de lo habitual/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })
})
