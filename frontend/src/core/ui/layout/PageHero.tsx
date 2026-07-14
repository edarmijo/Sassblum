import { motion } from 'framer-motion'
import { EASE_APPLE } from '../motion/ease'
import { InteractiveGlow } from '../InteractiveGlow'

const ORB_COLOR = {
  cyan: '#00d4ff',
  indigo: '#6366f1',
} as const

const ORB_POSITION = {
  'top-right': { primary: '-top-24 -right-16', secondary: '-bottom-20 -left-16' },
  'bottom-left': { primary: '-bottom-24 -left-16', secondary: '-top-20 -right-16' },
  'bottom-right': { primary: '-bottom-24 right-0', secondary: '-top-20 -left-16' },
} as const

interface PageHeroProps {
  eyebrow: string
  title: string
  subtitle: string
  accent?: keyof typeof ORB_COLOR
  orbPosition?: keyof typeof ORB_POSITION
}

/**
 * Hero estándar de las páginas públicas con grid animada, glow interactivo,
 * orbes flotantes y entrada escalonada.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  accent = 'cyan',
  orbPosition = 'top-right',
}: Readonly<PageHeroProps>) {
  const { primary, secondary } = ORB_POSITION[orbPosition]
  const orbColor = ORB_COLOR[accent]
  const secondaryColor = accent === 'cyan' ? '#6366f1' : '#00d4ff'

  return (
    <div className="relative text-white py-28 md:py-36 overflow-hidden" style={{ background: 'rgba(4,9,20,0.88)' }}>
      {/* Resplandor interactivo que sigue al cursor */}
      <InteractiveGlow color={orbColor} size={480} />

      {/* Orbe primario — flota suavemente */}
      <motion.div
        className={`absolute ${primary} h-96 w-96 rounded-full blur-2xl pointer-events-none`}
        style={{ background: `radial-gradient(circle, ${orbColor} 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Orbe secundario — movimiento contrario para profundidad */}
      <motion.div
        className={`absolute ${secondary} h-72 w-72 rounded-full blur-2xl pointer-events-none`}
        style={{ background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)` }}
        animate={{ x: [0, -16, 0], y: [0, 20, 0], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-brand-cyan mb-4 uppercase tracking-[0.4em] text-sm"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_APPLE, delay: 0.1 }}
          className="text-5xl md:text-7xl mb-5 font-semibold tracking-tight"
        >
          <span className="text-gradient-brand">{title}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_APPLE, delay: 0.22 }}
          className="text-xl text-gray-300 font-light max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      </div>
    </div>
  )
}
