import { useRef, useCallback, type MouseEvent } from 'react'

interface TiltOptions {
  maxTilt?: number // Máxima rotación en grados
  perspective?: number // Perspectiva CSS
  scale?: number // Escala al hover
  speed?: number // Velocidad de la transición (ms)
}

/**
 * Hook que aplica efecto tilt 3D a un elemento al mover el cursor.
 * Solo usa transform (GPU-accelerated).
 * Respeta prefers-reduced-motion via el componente padre.
 */
export function useTilt(options: TiltOptions = {}) {
  const { maxTilt = 15, perspective = 1000, scale = 1.02, speed = 400 } = options
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -maxTilt
      const rotateY = ((x - centerX) / centerX) * maxTilt

      ref.current.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
    },
    [maxTilt, perspective, scale],
  )

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
  }, [perspective])

  return {
    ref,
    style: {
      transformStyle: 'preserve-3d' as const,
      transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
      willChange: 'transform' as const,
    },
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  }
}
