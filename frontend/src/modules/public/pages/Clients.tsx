import { PageHero } from '../../../core/ui/layout/PageHero'
import { PublicClientLogosSection } from '../../clients/components/PublicClientLogoMarquee'
import { ClientLogoProvider } from '../../clients/hooks/ClientLogoProvider'
import { clientLogoService } from '../../clients/services/ClientLogoService'
import { PublicTestimonialsSection } from '../../testimonials/components/PublicTestimonialsSection'

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

      <PublicTestimonialsSection />

      <ClientLogoProvider service={clientLogoService}>
        <PublicClientLogosSection />
      </ClientLogoProvider>

    </div>
  )
}
