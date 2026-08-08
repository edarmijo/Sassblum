import type { CSSProperties } from 'react'
import { Star, Quote } from 'lucide-react'
import { LogoMarquee, type Brand } from '../../../core/ui/LogoMarquee'
import { GlowCard } from '../../../core/ui/GlowCard'
import { PageHero } from '../../../core/ui/layout/PageHero'
import { Reveal, FocusReveal } from '../../../core/ui/motion'
import { PublicClientLogosSection } from '../../clients/components/PublicClientLogoMarquee'
import { ClientLogoProvider } from '../../clients/hooks/ClientLogoProvider'
import { clientLogoService } from '../../clients/services/ClientLogoService'

const STAR_KEYS = Array.from({ length: 5 }, (_, i) => `star-${i}`)

const TESTIMONIALS = [
  { name: 'María González', company: 'Distribuidora Andina', text: 'SASS BLUM transformó nuestra infraestructura de red. El soporte es excelente y siempre responden a tiempo.' },
  { name: 'Carlos Mendoza', company: 'Clínica San Rafael', text: 'Instalaron todo nuestro sistema de CCTV y domótica. Profesionalismo de principio a fin.' },
  { name: 'Ana Vélez', company: 'Corporación Litoral', text: 'El equipo de soporte técnico es de primera. Resolvieron problemas que otros proveedores no pudieron.' },
]

const PARTNERS: Brand[] = [
  { name: 'Hikvision', domain: 'hikvision.com' },
  { name: 'Ubiquiti', domain: 'ui.com' },
  { name: 'Grandstream', domain: 'grandstream.com' },
  { name: 'ZKTeco', domain: 'zkteco.com' },
]

const cardStyle: CSSProperties = {
  background: 'rgba(8,22,36,0.7)',
  border: '1px solid rgba(0,196,224,0.12)',
  backdropFilter: 'blur(12px)',
}

export function Clients() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Confianza"
        title="Clientes"
        subtitle="Empresas e industrias que confían en nosotros"
        accent="cyan"
        orbPosition="top-right"
      />

      <section className="relative z-10 py-24 md:py-32" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="uppercase mb-3 tracking-[0.3em] text-sm" style={{ color: '#00c4e0' }}>Testimonios</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight" style={{ color: '#eef4f8' }}>
              Lo que dicen nuestros clientes
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <FocusReveal key={t.name} delay={i * 0.1}>
                <GlowCard className="h-full" style={cardStyle}>
                  <div className="p-8">
                    <Quote className="h-9 w-9 mb-4" style={{ color: 'rgba(0,196,224,0.3)' }} />
                    <p className="mb-6 leading-relaxed" style={{ color: '#7aa3b8' }}>{t.text}</p>
                    <div className="flex items-center gap-1 mb-3">
                      {STAR_KEYS.map((k) => (
                        <Star key={k} className="h-4 w-4 fill-brand-cyan text-brand-cyan" />
                      ))}
                    </div>
                    <p className="font-medium" style={{ color: '#eef4f8' }}>{t.name}</p>
                    <p className="text-sm" style={{ color: '#5c7a94' }}>{t.company}</p>
                  </div>
                </GlowCard>
              </FocusReveal>
            ))}
          </div>
        </div>
      </section>

      <ClientLogoProvider service={clientLogoService}>
        <PublicClientLogosSection />
      </ClientLogoProvider>

      <section className="relative z-10 py-20 md:py-28 overflow-hidden" style={{ background: 'rgba(0,0,0,0.32)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] mb-3 text-sm" style={{ color: '#00c4e0' }}>Aliados tecnológicos</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: '#eef4f8' }}>
              Marcas que integramos
            </h2>
            <p className="mt-3 max-w-2xl mx-auto" style={{ color: '#5c7a94' }}>
              Somos integradores autorizados de las marcas líderes en seguridad, redes y control de acceso.
            </p>
          </Reveal>
        </div>
        <LogoMarquee brands={PARTNERS} durationSec={28} />
      </section>
    </div>
  )
}
