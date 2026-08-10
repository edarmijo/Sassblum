import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CustomCursor from './CustomCursor'

interface MatchMediaController {
  setMatches: (matches: boolean) => void
}

function installMatchMedia(initialMatches: boolean): MatchMediaController {
  let matches = initialMatches
  const listeners = new Set<EventListener>()
  const mediaQuery = {
    get matches() {
      return matches
    },
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_type: string, listener: EventListener) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: EventListener) => listeners.delete(listener)),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches
      for (const listener of listeners) listener(new Event('change'))
    },
  }
}

function movePointer(x = 120, y = 80): void {
  fireEvent.pointerMove(globalThis.window, { clientX: x, clientY: y, pointerType: 'mouse' })
}

describe('CustomCursor resilience', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(globalThis.window, 'innerWidth', { value: 500, configurable: true })
  })

  afterEach(() => {
    cleanup()
    document.documentElement.classList.remove('custom-cursor-active')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps the native cursor until a fine pointer actually moves', () => {
    installMatchMedia(true)
    const { getByTestId } = render(<CustomCursor />)

    expect(document.documentElement).not.toHaveClass('custom-cursor-active')
    expect(getByTestId('custom-cursor').children[0]).toHaveStyle({ opacity: '0' })

    movePointer()

    expect(document.documentElement).toHaveClass('custom-cursor-active')
    expect(getByTestId('custom-cursor').children[0]).toHaveStyle({
      opacity: '1',
      transform: 'translate(120px, 80px)',
    })
  })

  it('does not use viewport width as an input-modality proxy', () => {
    installMatchMedia(true)
    render(<CustomCursor />)

    movePointer()

    expect(globalThis.window.innerWidth).toBe(500)
    expect(document.documentElement).toHaveClass('custom-cursor-active')
  })

  it.each(['blur', 'focus', 'pagehide', 'pageshow', 'pointercancel'])(
    'restores the native cursor on %s and waits for fresh movement',
    (eventName) => {
      installMatchMedia(true)
      render(<CustomCursor />)
      movePointer()

      globalThis.window.dispatchEvent(new Event(eventName))

      expect(document.documentElement).not.toHaveClass('custom-cursor-active')
      movePointer(40, 30)
      expect(document.documentElement).toHaveClass('custom-cursor-active')
    },
  )

  it('restores the native cursor when the pointer leaves the browser window', () => {
    installMatchMedia(true)
    render(<CustomCursor />)
    movePointer()

    fireEvent.pointerOut(globalThis.window, { relatedTarget: null, pointerType: 'mouse' })

    expect(document.documentElement).not.toHaveClass('custom-cursor-active')
  })

  it('restores the native cursor while hidden and waits for movement after returning', () => {
    let visibility: DocumentVisibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
    installMatchMedia(true)
    render(<CustomCursor />)
    movePointer()

    visibility = 'hidden'
    fireEvent(document, new Event('visibilitychange'))
    expect(document.documentElement).not.toHaveClass('custom-cursor-active')

    visibility = 'visible'
    fireEvent(document, new Event('visibilitychange'))
    expect(document.documentElement).not.toHaveClass('custom-cursor-active')
    movePointer()
    expect(document.documentElement).toHaveClass('custom-cursor-active')
  })

  it('reacts to pointer capability and reduced-motion media changes', () => {
    const media = installMatchMedia(true)
    render(<CustomCursor />)
    movePointer()
    expect(document.documentElement).toHaveClass('custom-cursor-active')

    media.setMatches(false)
    expect(document.documentElement).not.toHaveClass('custom-cursor-active')
    movePointer()
    expect(document.documentElement).not.toHaveClass('custom-cursor-active')

    media.setMatches(true)
    expect(document.documentElement).not.toHaveClass('custom-cursor-active')
    movePointer()
    expect(document.documentElement).toHaveClass('custom-cursor-active')
  })

  it('never hides the native cursor for an ineligible pointer', () => {
    installMatchMedia(false)
    render(<CustomCursor />)

    movePointer()

    expect(document.documentElement).not.toHaveClass('custom-cursor-active')
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('cleans up the global cursor state and listeners on unmount', () => {
    installMatchMedia(true)
    const { unmount } = render(<CustomCursor />)
    movePointer()
    expect(document.documentElement).toHaveClass('custom-cursor-active')

    unmount()
    movePointer()

    expect(document.documentElement).not.toHaveClass('custom-cursor-active')
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })
})
