import { motion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { EASE_APPLE } from './motion/ease'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

/**
 * Componente que anima sus hijos cuando entran en el viewport.
 * Wrapper semántico sobre framer-motion + IntersectionObserver.
 * Solo anima transform/opacity (compositor-friendly).
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 30,
}: Readonly<ScrollRevealProps>) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px 0px', amount: 0.3 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, ease: EASE_APPLE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
