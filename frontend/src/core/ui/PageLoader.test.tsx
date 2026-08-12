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
    expect(screen.getByText('SASS')).toHaveTextContent('SASSBLUM')
    expect(document.querySelector('.page-loader__percentage-value')).toBeInTheDocument()
    expect(document.querySelector('linearGradient#page-loader-gradient')).toBeInTheDocument()
    expect(intervalSpy).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(680))
    expect(screen.getByRole('status')).toHaveClass('page-loader--leaving')
    expect(onComplete).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(220))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('shortens the intro when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const onComplete = vi.fn()

    render(<PageLoader onComplete={onComplete} />)
    expect(screen.getByRole('status')).not.toHaveClass('page-loader--leaving')
    act(() => vi.advanceTimersByTime(0))
    expect(screen.getByRole('status')).toHaveClass('page-loader--leaving')
    act(() => vi.advanceTimersByTime(80))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('cancels completion when it unmounts', () => {
    const onComplete = vi.fn()
    const { unmount } = render(<PageLoader onComplete={onComplete} />)

    unmount()
    act(() => vi.runAllTimers())

    expect(onComplete).not.toHaveBeenCalled()
  })
})
