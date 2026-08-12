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
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { EASE_APPLE } from './ease'

const REVEAL_VIEWPORT = { once: true, margin: '-64px 0px', amount: 0.12 } as const
const MAX_REVEAL_DELAY = 0.24

function boundedDelay(delay: number): number {
  return Math.min(Math.max(delay, 0), MAX_REVEAL_DELAY)
}

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
}: Readonly<RevealProps>) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ ...REVEAL_VIEWPORT, once }}
      transition={{ duration, ease: EASE_APPLE, delay: boundedDelay(delay) }}
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
}: Readonly<FocusRevealProps>) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 48, scale: fromScale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.62, ease: EASE_APPLE, delay: boundedDelay(delay) }}
    >
      {children}
    </motion.div>
  )
}

interface RevealGroupProps {
  children: ReactNode
  className?: string
  /** Intervalo entre elementos. Se limita para no demorar listas largas. */
  stagger?: number
}

interface RevealItemProps {
  children: ReactNode
  className?: string
  focus?: boolean
}

const GROUP_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.56, ease: EASE_APPLE },
  },
}

/**
 * Un solo IntersectionObserver coordina una lista completa. El stagger está
 * acotado y cada elemento solo anima transform + opacity una vez.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
}: Readonly<RevealGroupProps>) {
  const reduce = useReducedMotion() ?? false
  const interval = Math.min(Math.max(stagger, 0.04), 0.1)

  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: interval } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Elemento semántico para usar dentro de RevealGroup. */
export function RevealItem({ children, className, focus = false }: Readonly<RevealItemProps>) {
  const reduce = useReducedMotion() ?? false
  const variants = focus
    ? GROUP_ITEM_VARIANTS
    : {
        ...GROUP_ITEM_VARIANTS,
        hidden: { opacity: 0, y: 24 },
        visible: GROUP_ITEM_VARIANTS.visible,
      }

  return (
    <motion.div className={className} variants={reduce ? undefined : variants}>
      {children}
    </motion.div>
  )
}
