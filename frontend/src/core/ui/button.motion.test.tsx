import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Button } from './button'

function pointerMedia(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

describe('Button magnetic feedback', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => pointerMedia(true)))
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => vi.unstubAllGlobals())

  it('tracks a fine pointer through compositor CSS variables and resets on leave', () => {
    const { getByRole } = render(<Button>Continuar</Button>)
    const button = getByRole('button')
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      x: 10,
      y: 20,
      left: 10,
      top: 20,
      right: 110,
      bottom: 60,
      width: 100,
      height: 40,
      toJSON: () => undefined,
    })

    fireEvent.pointerEnter(button, { clientX: 60, clientY: 40 })
    fireEvent.pointerMove(button, { clientX: 100, clientY: 50 })

    expect(button).toHaveAttribute('data-magnetic-active', 'true')
    expect(button.style.getPropertyValue('--magnetic-x')).not.toBe('')
    expect(button.style.getPropertyValue('--magnetic-y')).not.toBe('')

    fireEvent.pointerLeave(button)
    expect(button).not.toHaveAttribute('data-magnetic-active')
    expect(button.style.getPropertyValue('--magnetic-x')).toBe('')
    expect(button.style.getPropertyValue('--magnetic-y')).toBe('')
  })

  it('does not activate when motion or pointer capability disallows it', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => pointerMedia(false)))
    const { getByRole } = render(<Button>Continuar</Button>)
    const button = getByRole('button')

    fireEvent.pointerEnter(button, { clientX: 20, clientY: 20 })

    expect(button).not.toHaveAttribute('data-magnetic-active')
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })
})
