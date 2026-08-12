import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PageLoader } from './PageLoader'

describe('PageLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('completes the CSS intro without a frame-by-frame interval', () => {
    const onComplete = vi.fn()
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')

    render(<PageLoader onComplete={onComplete} />)
    expect(screen.getByRole('status', { name: 'Preparando experiencia SassBlum' })).toBeInTheDocument()
    expect(intervalSpy).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(620))
    expect(screen.getByRole('status')).toHaveClass('page-loader--leaving')
    expect(onComplete).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(260))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('shortens the intro when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const onComplete = vi.fn()

    render(<PageLoader onComplete={onComplete} />)
    act(() => vi.advanceTimersByTime(380))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
