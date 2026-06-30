import { useRef, useCallback, type ReactNode, type MouseEvent, type CSSProperties } from 'react'
import { cn } from './utils'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  maxTilt?: number
  style?: CSSProperties
}

/**
 * Card con efecto glow que sigue al cursor + tilt 3D sutil.
 * El "glare" (brillo) se posiciona con JS para seguir el puntero.
 * Solo usa transform + opacity (compositor-friendly).
 */
export function GlowCard({
  children,
  className,
  glowColor = 'rgba(0, 212, 255, 0.15)',
  maxTilt = 12,
  style,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || !glareRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Rotación 3D
      const rotateX = ((y - centerY) / centerY) * -maxTilt
      const rotateY = ((x - centerX) / centerX) * maxTilt
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`

      // Glare effect (brillo que sigue al cursor)
      const glareX = (x / rect.width) * 100
      const glareY = (y / rect.height) * 100
      glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, ${glowColor}, transparent 60%)`
      glareRef.current.style.opacity = '1'
    },
    [maxTilt, glowColor],
  )

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current || !glareRef.current) return
    cardRef.current.style.transform =
      'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
    glareRef.current.style.opacity = '0'
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-xl transition-transform duration-500 ease-out will-change-transform',
        className,
      )}
      style={{ transformStyle: 'preserve-3d', ...style }}
    >
      {/* Glare overlay */}
      <div
        ref={glareRef}
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0 transition-opacity duration-300 z-10"
        aria-hidden
      />
      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  )
}
