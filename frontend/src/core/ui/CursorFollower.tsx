import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * CursorFollower — cursor personalizado de tres capas (estilo Antigravity):
 *   · punto sólido (rápido)
 *   · anillo seguidor (lento, lerp)
 *   · estela tenue (más lento)
 * Crece y cambia a cyan sobre elementos interactivos (a, button, [data-cursor]).
 *
 * Solo desktop. No se monta en mobile ni con prefers-reduced-motion.
 * Posiciona vía requestAnimationFrame + lerp (sin re-render de React).
 */
export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce || globalThis.window.innerWidth < 768) return
    const dot = dotRef.current
    const ring = ringRef.current
    const trail = trailRef.current
    if (!dot || !ring || !trail) return

    const m = { x: globalThis.window.innerWidth / 2, y: globalThis.window.innerHeight / 2 }
    let cx = m.x, cy = m.y, fx = m.x, fy = m.y, tx = m.x, ty = m.y
    let raf = 0

    const onMove = (e: MouseEvent) => {
      m.x = e.clientX
      m.y = e.clientY
    }
    document.addEventListener('mousemove', onMove, { passive: true })

    const loop = () => {
      cx += (m.x - cx) * 0.2
      cy += (m.y - cy) * 0.2
      fx += (m.x - fx) * 0.08
      fy += (m.y - fy) * 0.08
      tx += (m.x - tx) * 0.04
      ty += (m.y - ty) * 0.04
      dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`
      ring.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%)`
      trail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // Estado hover sobre elementos interactivos.
    const enter = () => {
      ring.style.width = ring.style.height = '64px'
      ring.style.borderColor = '#00d4ff'
      ring.style.background = 'rgba(0,212,255,0.08)'
      dot.style.width = dot.style.height = '12px'
    }
    const leave = () => {
      ring.style.width = ring.style.height = '40px'
      ring.style.borderColor = 'rgba(255,255,255,0.35)'
      ring.style.background = 'transparent'
      dot.style.width = dot.style.height = '8px'
    }
    const targets = document.querySelectorAll('a, button, [role="button"], [data-cursor]')
    targets.forEach((el) => {
      el.addEventListener('mouseenter', enter)
      el.addEventListener('mouseleave', leave)
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      targets.forEach((el) => {
        el.removeEventListener('mouseenter', enter)
        el.removeEventListener('mouseleave', leave)
      })
    }
  }, [reduce])

  if (reduce || (globalThis.window !== undefined && globalThis.window.innerWidth < 768)) return null

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-10000 rounded-full bg-white mix-blend-difference"
        style={{ width: 8, height: 8, transition: 'width .3s, height .3s' }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-10000 rounded-full border"
        style={{ width: 40, height: 40, borderColor: 'rgba(255,255,255,0.35)', transition: 'width .4s, height .4s, border-color .3s, background .3s' }}
      />
      <div
        ref={trailRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-10000 rounded-full"
        style={{ width: 5, height: 5, background: '#00d4ff', opacity: 0.5 }}
      />
    </>
  )
}
