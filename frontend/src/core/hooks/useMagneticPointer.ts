import { useCallback, useEffect, useRef, type PointerEventHandler } from 'react'

const MAGNETIC_MEDIA_QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
const MAX_OFFSET_PX = 12

interface MagneticPointerHandlers<T extends HTMLElement> {
  onPointerEnter: PointerEventHandler<T>
  onPointerMove: PointerEventHandler<T>
  onPointerLeave: PointerEventHandler<T>
  onPointerCancel: PointerEventHandler<T>
}

function supportsMagneticPointer(): boolean {
  return typeof globalThis.matchMedia === 'function'
    && globalThis.matchMedia(MAGNETIC_MEDIA_QUERY).matches
}

function clampOffset(value: number): number {
  return Math.min(Math.max(value, -MAX_OFFSET_PX), MAX_OFFSET_PX)
}

/**
 * Pointer-following transform shared by buttons and CTA links.
 * The bounding box is read once on entry; writes are coalesced per frame and
 * only update CSS variables, keeping the interaction on the compositor.
 */
export function useMagneticPointer<T extends HTMLElement>(strength = 0.22): MagneticPointerHandlers<T> {
  const rectRef = useRef<DOMRect | null>(null)
  const elementRef = useRef<T | null>(null)
  const frameRef = useRef<number | null>(null)
  const pendingOffsetRef = useRef({ x: 0, y: 0 })

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) {
      globalThis.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  const resetElement = useCallback((element: T) => {
    cancelFrame()
    delete element.dataset.magneticActive
    element.style.removeProperty('--magnetic-x')
    element.style.removeProperty('--magnetic-y')
    rectRef.current = null
    elementRef.current = null
  }, [cancelFrame])

  const onPointerEnter = useCallback<PointerEventHandler<T>>((event) => {
    if (!supportsMagneticPointer() || event.currentTarget.matches(':disabled, [aria-disabled="true"]')) return
    elementRef.current = event.currentTarget
    rectRef.current = event.currentTarget.getBoundingClientRect()
    event.currentTarget.dataset.magneticActive = 'true'
  }, [])

  const onPointerMove = useCallback<PointerEventHandler<T>>((event) => {
    const rect = rectRef.current
    if (!rect || elementRef.current !== event.currentTarget) return

    pendingOffsetRef.current = {
      x: clampOffset((event.clientX - rect.left - rect.width / 2) * strength),
      y: clampOffset((event.clientY - rect.top - rect.height / 2) * strength),
    }
    if (frameRef.current !== null) return

    frameRef.current = globalThis.requestAnimationFrame(() => {
      frameRef.current = null
      const element = elementRef.current
      if (!element) return
      element.style.setProperty('--magnetic-x', `${pendingOffsetRef.current.x}px`)
      element.style.setProperty('--magnetic-y', `${pendingOffsetRef.current.y}px`)
    })
  }, [strength])

  const onPointerLeave = useCallback<PointerEventHandler<T>>((event) => {
    resetElement(event.currentTarget)
  }, [resetElement])

  useEffect(() => () => {
    cancelFrame()
    const element = elementRef.current
    if (element) {
      delete element.dataset.magneticActive
      element.style.removeProperty('--magnetic-x')
      element.style.removeProperty('--magnetic-y')
    }
  }, [cancelFrame])

  return { onPointerEnter, onPointerMove, onPointerLeave, onPointerCancel: onPointerLeave }
}
