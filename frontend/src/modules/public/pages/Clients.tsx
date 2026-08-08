import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'
import { PageHero } from '../../../core/ui/layout/PageHero'
import { Reveal } from '../../../core/ui/motion'

const CLIENT_LOGO_SHEET =
  'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/clients/sassblum-clientes.png'

const CLIENTS = [
  'Policentro',
  'SCD — Sistema de Control Documental',
  'Velázquez Velázquez Abogados',
  'Todo Fiesta',
  'La Sevillana',
  'Sony',
  'Acería Xinlong S.A.',
  'Banapov',
  'Omaconsa',
  'IMDO Sport Medical Center',
  'Soelec',
  'Globos Payaso',
  'Crokitos',
  'Regus',
  'Viamatica',
  'Súper Éxito',
] as const

export function Clients() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Confianza"
        title="Nuestros clientes"
        subtitle="Empresas e instituciones que han confiado en las soluciones de SassBlum"
        accent="cyan"
        orbPosition="top-right"
      />

      <section className="relative z-10 py-24 md:py-32" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.3em]" style={{ color: '#00c4e0' }}>
              Experiencia comprobada
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl" style={{ color: '#eef4f8' }}>
              Empresas que confían en nosotros
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed" style={{ color: '#7aa3b8' }}>
              Cada marca representa un proyecto y una relación profesional construida por SassBlum.
            </p>
          </Reveal>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white p-4 shadow-2xl shadow-black/30 sm:p-8">
            <ImageWithFallback
              src={CLIENT_LOGO_SHEET}
              alt={`Logotipos de clientes SassBlum: ${CLIENTS.join(', ')}`}
              className="mx-auto block h-auto w-full max-w-4xl object-contain"
            />
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-3" aria-label="Clientes SassBlum">
            {CLIENTS.map((client) => (
              <li
                key={client}
                className="rounded-full border border-brand-cyan/15 bg-brand-navy/60 px-4 py-2 text-sm"
                style={{ color: '#a9c4d3' }}
              >
                {client}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
