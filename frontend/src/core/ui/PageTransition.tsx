import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { pageTransition } from '../utils/animation'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Wrapper que aplica transiciones de página fluidas (blur + fade + slide).
 * Usa AnimatePresence de framer-motion para detectar cambios de ruta.
 * Respeta prefers-reduced-motion (framer-motion lo maneja automáticamente).
 */
export function PageTransition({ children }: Readonly<PageTransitionProps>) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
