import { memo } from 'react'

interface GridBackgroundProps {
  color?: string
  cellSize?: number
  opacity?: number
  animated?: boolean
}

/**
 * Grilla animada de fondo estilo futurista/tech.
 * Renderiza una cuadrícula CSS que puede hacer scroll infinito.
 * Componente puramente decorativo — aria-hidden.
 * Usa solo background-image + animation (GPU-friendly).
 */
export const GridBackground = memo(function GridBackground({
  color = '#00d4ff',
  cellSize = 60,
  opacity = 0.08,
  animated = true,
}: GridBackgroundProps) {
  const alphaHex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(${color}${alphaHex} 1px, transparent 1px),
          linear-gradient(90deg, ${color}${alphaHex} 1px, transparent 1px)
        `,
        backgroundSize: `${cellSize}px ${cellSize}px`,
        animation: animated ? 'grid-scroll 8s linear infinite' : 'none',
        willChange: animated ? 'background-position' : 'auto',
      }}
    />
  )
})
