import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

interface InteractiveGlowProps {
  /** Color del resplandor (hex). */
  color?: string
  /** Diámetro del resplandor en px. */
  size?: number
}

/**
 * Resplandor que sigue al cursor sobre la sección padre (estilo Antigravity).
 *
 * Rendimiento: solo se anima `transform` sobre una capa `will-change:transform`,
 * por lo que el desenfoque se rasteriza una vez y cada frame solo se *compone*
 * (no se repinta). El listener se adjunta al elemento padre (que debe ser
 * `relative` + `overflow-hidden`) y se actualiza con requestAnimationFrame.
 * Respeta `prefers-reduced-motion`.
 */
export function InteractiveGlow({ color = '#00d4ff', size = 520 }: InteractiveGlowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent || reduce) return

    let raf = 0
    const half = size / 2

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = parent.getBoundingClientRect()
        const x = e.clientX - rect.left - half
        const y = e.clientY - rect.top - half
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.style.opacity = '1'
      })
    }
    const onLeave = () => {
      el.style.opacity = '0'
    }

    parent.addEventListener('pointermove', onMove)
    parent.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      parent.removeEventListener('pointermove', onMove)
      parent.removeEventListener('pointerleave', onLeave)
    }
  }, [reduce, size])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 rounded-full blur-3xl opacity-0 mix-blend-screen transition-opacity duration-500"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}59 0%, transparent 70%)`,
        willChange: 'transform, opacity',
      }}
    />
  )
}
