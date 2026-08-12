import { useRef, type CSSProperties } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { Target, Eye, Award, Users } from 'lucide-react'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'
import { GlowCard } from '../../../core/ui/GlowCard'
import { InteractiveGlow } from '../../../core/ui/InteractiveGlow'
import { PageHero } from '../../../core/ui/layout/PageHero'
import { Reveal, RevealGroup, RevealItem } from '../../../core/ui/motion'
import { EASE_APPLE } from '../../../core/ui/motion/ease'

const VALUES = [
  { icon: Target, title: 'Misión', text: 'Brindar soluciones tecnológicas integrales que impulsen la competitividad de nuestros clientes.' },
  { icon: Eye, title: 'Visión', text: 'Ser el aliado tecnológico líder en Ecuador, reconocido por su innovación y servicio.' },
  { icon: Award, title: 'Calidad', text: 'Más de 20 años entregando proyectos con los más altos estándares del mercado.' },
  { icon: Users, title: 'Equipo', text: 'Profesionales certificados comprometidos con el éxito de cada proyecto.' },
]

const STATS = [
  { value: '20+', label: 'Años de experiencia' },
  { value: '500+', label: 'Proyectos entregados' },
  { value: '100%', label: 'Compromiso total' },
]

function ParallaxImage() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1])

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl shadow-2xl h-96 md:h-120" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.55)', border: '1px solid rgba(0,196,224,0.12)' }}>
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y, scale }}>
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=82"
          sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 3rem), 592px"
          alt="Equipo SASS BLUM"
          className="w-full h-full object-cover"
        />
      </motion.div>
    </div>
  )
}

export function About() {
  const reduce = useReducedMotion() ?? false
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Quiénes somos"
        title="Nosotros"
        subtitle="La conexión perfecta entre tu empresa y la tecnología"
        accent="indigo"
        orbPosition="bottom-left"
      />

      {/* ── Sobre nosotros — imagen con parallax + texto ─── */}
      <section className="relative z-10 py-24 md:py-32" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal y={24}>
            <ParallaxImage />
          </Reveal>
          <Reveal y={32} delay={0.1}>
            <p className="uppercase mb-3 tracking-[0.3em] text-sm" style={{ color: '#00c4e0' }}>Quiénes somos</p>
            <h2 className="text-3xl md:text-5xl mb-5 font-semibold tracking-tight leading-tight" style={{ color: '#eef4f8' }}>
              20+ años de experiencia en tecnología
            </h2>
            <p className="mb-4 leading-relaxed" style={{ color: '#7aa3b8' }}>
              SASS BLUM es una firma de soluciones y servicios tecnológicos ubicada en Guayaquil, Ecuador. Actuamos como
              integradores de tecnología, la conexión perfecta entre los ejecutivos y sus distintos proveedores.
            </p>
            <p className="leading-relaxed" style={{ color: '#7aa3b8' }}>
              Acompañamos a empresas e industrias en infraestructura IT, soporte técnico, cableado estructurado, CCTV,
              domótica y mucho más, con un enfoque personalizado y centrado en el cliente.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Banner de estadísticas ─── */}
      <section className="relative z-10 py-28 md:py-36 overflow-hidden" style={{ background: 'rgba(0,196,224,0.04)' }}>
        <InteractiveGlow color="#6366f1" size={560} />
        <motion.div
          className="absolute -top-20 -right-20 h-80 w-80 rounded-full blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)' }}
          animate={reduce ? undefined : { scale: [1, 1.1, 1], opacity: [0.15, 0.28, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-3xl mx-auto leading-tight" style={{ color: '#eef4f8' }}>
              Tecnología que{' '}
              <span className="text-gradient-brand">transforma empresas</span>
            </h2>
          </Reveal>
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-3 gap-12 mt-20" stagger={0.09}>
            {STATS.map((s) => (
              <RevealItem key={s.label}>
                <p className="text-6xl md:text-7xl font-semibold tracking-tight text-brand-cyan">
                  {s.value}
                </p>
                <p className="mt-3 uppercase tracking-widest text-sm" style={{ color: '#7aa3b8' }}>{s.label}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Valores — tarjetas con GlowCard tilt ─── */}
      <section className="relative z-10 py-24 md:py-32" style={{ background: 'rgba(0,0,0,0.32)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="uppercase mb-3 tracking-[0.3em] text-sm" style={{ color: '#00c4e0' }}>Nuestros valores</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight" style={{ color: '#eef4f8' }}>
              Lo que nos define
            </h2>
          </Reveal>
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <RevealItem key={v.title} focus>
                <GlowCard className="h-full" style={{ background: 'rgba(8,22,36,0.7)', border: '1px solid rgba(0,196,224,0.12)', backdropFilter: 'blur(12px)' } as CSSProperties}>
                  <div className="p-8 text-center">
                    <motion.div
                      className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5 mx-auto"
                      style={{ background: 'rgba(0,196,224,0.1)', border: '1px solid rgba(0,196,224,0.2)' }}
                      whileHover={reduce ? undefined : { scale: 1.08, rotate: -6 }}
                      transition={{ duration: 0.3, ease: EASE_APPLE }}
                    >
                      <v.icon className="h-7 w-7 text-brand-cyan" />
                    </motion.div>
                    <h3 className="text-lg mb-2 font-semibold" style={{ color: '#eef4f8' }}>{v.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#7aa3b8' }}>{v.text}</p>
                  </div>
                </GlowCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </div>
  )
}
