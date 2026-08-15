import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeferredVisualEffects } from './DeferredVisualEffects'

vi.mock('./VisualEffects', () => ({
  VisualEffects: () => <div data-testid="webgl-visual-effects" />,
}))

interface MediaPreferences {
  desktop?: boolean
  reducedMotion?: boolean
}

function installMatchMedia({ desktop = true, reducedMotion = false }: MediaPreferences = {}) {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : desktop,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as MediaQueryList)))
}

describe('DeferredVisualEffects', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.window, 'innerWidth', { value: 1280, configurable: true })
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true })
    installMatchMedia()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('always paints the shared atmosphere without relying on a route allowlist', () => {
    render(<DeferredVisualEffects />)

    expect(screen.getByTestId('global-visual-base')).toBeInTheDocument()
    expect(document.querySelector('[data-visual-fallback="mobile"]')).toBeInTheDocument()
    expect(document.querySelector('[data-visual-fallback="desktop"]')).toBeInTheDocument()
  })

  it('loads the WebGL layer after critical work on an eligible desktop', async () => {
    let idleCallback: IdleRequestCallback | undefined
    vi.stubGlobal('requestIdleCallback', vi.fn((callback: IdleRequestCallback) => {
      idleCallback = callback
      return 1
    }))
    vi.stubGlobal('cancelIdleCallback', vi.fn())

    render(<DeferredVisualEffects />)
    expect(screen.queryByTestId('webgl-visual-effects')).not.toBeInTheDocument()

    await act(async () => {
      idleCallback?.({ didTimeout: false, timeRemaining: () => 16 })
    })

    expect(await screen.findByTestId('webgl-visual-effects')).toBeInTheDocument()
    expect(document.querySelector('[data-visual-fallback="desktop"]')).not.toBeInTheDocument()
  })

  it('keeps a static-capable CSS fallback and skips Three.js for reduced motion', () => {
    installMatchMedia({ reducedMotion: true })
    const idleSpy = vi.fn()
    vi.stubGlobal('requestIdleCallback', idleSpy)

    render(<DeferredVisualEffects />)

    expect(document.querySelector('[data-visual-fallback="desktop"]')).toBeInTheDocument()
    expect(screen.queryByTestId('webgl-visual-effects')).not.toBeInTheDocument()
    expect(idleSpy).not.toHaveBeenCalled()
  })
})
