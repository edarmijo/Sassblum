import { LogoMarquee, type Brand } from '../../../core/ui/LogoMarquee'
import { Reveal } from '../../../core/ui/motion'
import { usePublicClientLogos } from '../hooks/useClientLogo'

/** Public composition: hides the whole section when no administrator has published logos. */
export function PublicClientLogosSection() {
  const { clientLogos, loading } = usePublicClientLogos()
  if (loading || clientLogos.length === 0) return null

  const brands: Brand[] = clientLogos
    .filter((logo) => Boolean(logo.logoUrl))
    .map((logo) => ({ name: logo.nombre, logoUrl: logo.logoUrl }))

  if (brands.length === 0) return null

  return (
    <section className="relative z-10 overflow-hidden py-20 md:py-28" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="mx-auto mb-12 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="mb-3 text-sm uppercase tracking-[0.3em]" style={{ color: '#00c4e0' }}>Experiencia comprobada</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: '#eef4f8' }}>
            Clientes que confían en nosotros
          </h2>
        </Reveal>
      </div>
      <LogoMarquee brands={brands} durationSec={Math.max(32, brands.length * 5)} />
    </section>
  )
}
