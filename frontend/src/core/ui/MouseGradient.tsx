import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * MouseGradient — resplandor radial cyan que sigue al cursor (estilo Mimo/Xiaomi).
 * Capa fija con mix-blend screen. Se actualiza vía CSS custom properties
 * (sin re-render de React). No se monta en reduced-motion ni en móvil.
 */
export function MouseGradient() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce || globalThis.window.innerWidth < 768) return
    const el = ref.current
    if (!el) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${e.clientX}px`)
        el.style.setProperty('--my', `${e.clientY}px`)
      })
    }
    globalThis.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      globalThis.removeEventListener('mousemove', onMove)
    }
  }, [reduce])

  if (reduce || (globalThis.window !== undefined && globalThis.window.innerWidth < 768)) return null

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-1 hidden md:block"
      style={{
        opacity: 0.1,
        mixBlendMode: 'screen',
        background:
          'radial-gradient(700px circle at var(--mx, 50%) var(--my, 50%), #00c4e0 0%, transparent 60%)',
      }}
    />
  )
}
