import { useRef, useCallback, type ReactNode, type MouseEvent } from 'react'
import { motion, useMotionValue, useReducedMotion } from 'framer-motion'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number
}

/**
 * Envuelve cualquier hijo con un efecto magnético: el elemento sigue ligeramente
 * al cursor cuando está dentro del bounding box y regresa con un spring suave.
 * Solo activo en desktop; se desactiva con prefers-reduced-motion.
 */
export function MagneticButton({ children, className, strength = 0.3 }: Readonly<MagneticButtonProps>) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const reduce = useReducedMotion()

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (reduce || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      x.set((e.clientX - rect.left - rect.width / 2) * strength)
      y.set((e.clientY - rect.top - rect.height / 2) * strength)
    },
    [strength, reduce, x, y],
  )

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}
