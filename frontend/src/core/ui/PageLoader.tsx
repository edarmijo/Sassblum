import { useEffect, useRef, useState } from 'react'

interface PageLoaderProps {
  readonly onComplete: () => void
}

const INTRO_DISPLAY_MS = 680
const INTRO_FADE_MS = 220
const REDUCED_MOTION_TOTAL_MS = 80

/**
 * Brief branded intro that never gates application or network initialization.
 * The progress illusion runs in CSS instead of re-rendering React every frame.
 */
export function PageLoader({ onComplete }: Readonly<PageLoaderProps>) {
  const [isLeaving, setIsLeaving] = useState(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const reduceMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    const leaveMs = reduceMotion ? 0 : INTRO_DISPLAY_MS
    const completeMs = reduceMotion
      ? REDUCED_MOTION_TOTAL_MS
      : INTRO_DISPLAY_MS + INTRO_FADE_MS
    const leaveId = globalThis.setTimeout(() => setIsLeaving(true), leaveMs)
    const completeId = globalThis.setTimeout(
      () => onCompleteRef.current(),
      completeMs,
    )

    return () => {
      globalThis.clearTimeout(leaveId)
      globalThis.clearTimeout(completeId)
    }
  }, [])

  return (
    <div
      role="status"
      aria-label="Preparando experiencia SassBlum"
      className={`page-loader ${isLeaving ? 'page-loader--leaving' : ''}`}
    >
      <div className="page-loader__ambient" aria-hidden="true" />
      <div className="page-loader__content">
        <div className="page-loader__mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="136" height="136">
            <defs>
              <linearGradient id="page-loader-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7ee8f9" />
                <stop offset="0.56" stopColor="#00d4ff" />
                <stop offset="1" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <circle className="page-loader__orbit" cx="60" cy="60" r="53" fill="none" strokeWidth="1" />
            <circle className="page-loader__track" cx="60" cy="60" r="45" fill="none" strokeWidth="3" />
            <circle
              className="page-loader__progress"
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="url(#page-loader-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="283"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="page-loader__percentage">
            <span className="page-loader__percentage-value" />
            <span className="page-loader__percentage-unit">%</span>
          </div>
        </div>
        <div className="page-loader__brand">SASS<span>BLUM</span></div>
        <div className="page-loader__caption">
          <span aria-hidden="true" />
          Soluciones tecnológicas
          <span aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
