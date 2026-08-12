import { useEffect, useRef, useState } from 'react'

interface PageLoaderProps {
  readonly onComplete: () => void
}

const INTRO_DISPLAY_MS = 620
const INTRO_FADE_MS = 260
const REDUCED_MOTION_DISPLAY_MS = 120

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
    const displayMs = reduceMotion ? REDUCED_MOTION_DISPLAY_MS : INTRO_DISPLAY_MS
    const leaveId = globalThis.setTimeout(() => setIsLeaving(true), displayMs)
    const completeId = globalThis.setTimeout(
      () => onCompleteRef.current(),
      displayMs + INTRO_FADE_MS,
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
          <svg viewBox="0 0 100 100" width="120" height="120">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(56,217,245,0.12)" strokeWidth="2" />
            <circle
              className="page-loader__progress"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#38d9f5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="283"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <span className="page-loader__pulse" />
        </div>
        <div className="page-loader__brand">SASS <span>BLUM</span></div>
        <div className="page-loader__caption">Preparando experiencia</div>
      </div>
    </div>
  )
}
