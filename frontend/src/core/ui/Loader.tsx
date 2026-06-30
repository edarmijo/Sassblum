import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const CIRC = 283 // 2π·45
const SESSION_KEY = 'sassblum:loaded'

/**
 * Loader inicial inmersivo (estilo referencia): overlay navy con anillo SVG de
 * progreso, wordmark y porcentaje. Se muestra una vez por sesión y luego se
 * desvanece. Con prefers-reduced-motion no se muestra (salto inmediato).
 */
export function Loader() {
  const reduce = useReducedMotion()
  const alreadyLoaded = typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1'
  const [visible, setVisible] = useState(!alreadyLoaded && !reduce)
  const [hidden, setHidden] = useState(false)
  const [pct, setPct] = useState(0)
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!visible) return
    if (reduce) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setVisible(false)
      return
    }
    let raf = 0
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const value = Math.round(eased * 100)
      setPct(value)
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(CIRC - (value / 100) * CIRC)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        sessionStorage.setItem(SESSION_KEY, '1')
        setHidden(true) // dispara fade-out
        window.setTimeout(() => setVisible(false), 700)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, reduce])

  if (!visible) return null

  return (
    <div
      aria-hidden={hidden}
      role="status"
      aria-label="Cargando SassBlum"
      className="fixed inset-0 z-10001 flex items-center justify-center bg-brand-navy-deep transition-opacity duration-700"
      style={{ opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' }}
    >
      <div className="relative text-center">
        <div className="relative mx-auto mb-8 h-30 w-30">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
            <circle
              ref={ringRef}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold tracking-[0.15em] text-white">
            SASS<span className="text-brand-cyan">BLUM</span>
          </span>
        </div>
        <p className="font-display text-sm tracking-widest text-gray-500 tabular-nums">{pct}%</p>
      </div>
    </div>
  )
}
