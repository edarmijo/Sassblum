import { useState, useEffect } from 'react'

interface MousePosition {
  x: number
  y: number
  normalizedX: number // -1 a 1
  normalizedY: number // -1 a 1
}

/**
 * Hook que rastrea la posición del cursor en tiempo real.
 * Respeta prefers-reduced-motion.
 * Usa passive listener para no bloquear el compositor.
 */
export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  })

  useEffect(() => {
    const prefersReduced = globalThis.window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const handler = (e: MouseEvent) => {
      setPosition({
        x: e.clientX,
        y: e.clientY,
        normalizedX: (e.clientX / globalThis.window.innerWidth) * 2 - 1,
        normalizedY: (e.clientY / globalThis.window.innerHeight) * 2 - 1,
      })
    }

    globalThis.window.addEventListener('mousemove', handler, { passive: true })
    return () => globalThis.window.removeEventListener('mousemove', handler)
  }, [])

  return position
}
