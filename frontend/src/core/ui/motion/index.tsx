/**
 * Motion primitives — animaciones cinematográficas reutilizables (estilo Apple).
 * Construidas sobre framer-motion. Todas respetan `prefers-reduced-motion`.
 *
 * - <Reveal>      : entrada con fade + desplazamiento al entrar en viewport.
 * - <FocusReveal> : el hijo "entra en foco" (escala + fade + desplazamiento).
 *
 * Solo animan transform/opacity (compositor-friendly) y son one-shot al entrar
 * en viewport — no hacen trabajo en cada frame de scroll.
 */
import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_APPLE } from './ease'

interface RevealProps {
  children: ReactNode
  /** Desplazamiento vertical inicial en px (default 28). */
  y?: number
  /** Retraso en segundos para escalonar (stagger). */
  delay?: number
  /** Duración en segundos (default 0.7). */
  duration?: number
  once?: boolean
  className?: string
}

export function Reveal({
  children,
  y = 28,
  delay = 0,
  duration = 0.7,
  once = true,
  className,
}: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration, ease: EASE_APPLE, delay }}
    >
      {children}
    </motion.div>
  )
}

interface FocusRevealProps {
  children: ReactNode
  className?: string
  /** Escala inicial mientras está "fuera de foco" (default 0.92). */
  fromScale?: number
  /** Retraso en segundos para escalonar (stagger). */
  delay?: number
}

/**
 * El contenido "entra en foco" al aparecer: escala + fade + desplazamiento.
 * Animación one-shot vía whileInView (solo transform/opacity, compositor-friendly)
 * — no recalcula nada en cada frame de scroll.
 */
export function FocusReveal({
  children,
  className,
  fromScale = 0.92,
  delay = 0,
}: FocusRevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 48, scale: fromScale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: EASE_APPLE, delay }}
    >
      {children}
    </motion.div>
  )
}
