import { ArrowUpRight, Mail, Phone } from 'lucide-react'
import { SmoothLink as Link } from '../SmoothLink'

const serviceLinks = [
  'Infraestructura IT',
  'Soporte Técnico',
  'Cableado Estructurado',
] as const

const additionalLinks = ['Sistema CCTV', 'Domótica', 'Servidores'] as const

const navigationLinkClassName =
  'group inline-flex min-h-11 max-w-full min-w-0 items-center gap-2 py-2 font-display text-[0.9rem] leading-snug text-[#c3d2e3] no-underline transition-[color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 hover:text-[#76e7f5] focus-visible:translate-x-1 focus-visible:text-[#76e7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ee7f5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426] motion-reduce:transform-none motion-reduce:transition-none'

const sectionHeadingClassName =
  'mb-3 font-display text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-[#76e7f5]'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      id="site-footer"
      className="relative z-10 w-full pt-8 sm:pt-10 lg:pt-14"
      style={{
        paddingInlineStart: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingInlineEnd: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div
        className="relative mx-auto max-w-[1440px] overflow-hidden rounded-t-[1.5rem] border border-b-0 border-white/10"
        style={{
          background:
            'linear-gradient(145deg, rgba(5, 13, 26, 0.84) 0%, rgba(10, 27, 48, 0.72) 54%, rgba(5, 13, 26, 0.86) 100%)',
          boxShadow: '0 -18px 60px rgba(1, 8, 20, 0.3)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5ee7f5]/70 to-transparent"
        />

        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] lg:gap-16 lg:py-14">
            <div className="min-w-0 lg:max-w-sm">
              <Link
                to="/"
                aria-label="Sassblum, ir al inicio"
                className="inline-flex min-h-11 items-center font-display text-[clamp(1.45rem,4vw,1.75rem)] font-bold tracking-[-0.035em] text-[#eef7ff] no-underline transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ee7f5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426] motion-reduce:transition-none"
              >
                SASS<span className="text-[#5ee7f5]">BLUM</span>
              </Link>
              <p className="mt-3 max-w-[34rem] font-display text-[0.94rem] leading-7 text-[#bfd0e2] lg:max-w-xs">
                Innovación tecnológica para tu negocio. Más de 20 años creando
                infraestructura confiable.
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-9 sm:gap-x-10 md:grid-cols-3 md:gap-y-8">
              <nav aria-labelledby="footer-services-heading" className="min-w-0">
                <h2 id="footer-services-heading" className={sectionHeadingClassName}>
                  Servicios
                </h2>
                <ul className="m-0 list-none p-0">
                  {serviceLinks.map((label) => (
                    <li key={label} className="min-w-0">
                      <Link to="/servicios" className={navigationLinkClassName}>
                        <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-labelledby="footer-more-heading" className="min-w-0">
                <h2 id="footer-more-heading" className={sectionHeadingClassName}>
                  Más
                </h2>
                <ul className="m-0 list-none p-0">
                  {additionalLinks.map((label) => (
                    <li key={label} className="min-w-0">
                      <Link to="/servicios" className={navigationLinkClassName}>
                        <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <address
                aria-labelledby="footer-contact-heading"
                className="col-span-2 min-w-0 not-italic md:col-span-1"
              >
                <h2 id="footer-contact-heading" className={sectionHeadingClassName}>
                  Contacto
                </h2>
                <ul className="m-0 list-none p-0">
                  <li className="min-w-0">
                    <a
                      href="mailto:info@sassblum.com"
                      className={navigationLinkClassName}
                    >
                      <Mail aria-hidden="true" className="size-4 shrink-0" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        info@sassblum.com
                      </span>
                    </a>
                  </li>
                  <li className="min-w-0">
                    <a href="tel:+593969990990" className={navigationLinkClassName}>
                      <Phone aria-hidden="true" className="size-4 shrink-0" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        +593 96 999 0990
                      </span>
                    </a>
                  </li>
                  <li className="min-w-0">
                    <a
                      href="https://www.instagram.com/sassblum/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={navigationLinkClassName}
                    >
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                      />
                      <span>Instagram</span>
                      <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                  </li>
                </ul>
              </address>
            </div>
          </div>

          <div
            className="border-t border-[#91b4d4]/20 py-6 text-left font-display text-[0.82rem] leading-6 text-[#b7c9dc]"
            style={{
              paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <p className="min-w-0 [overflow-wrap:anywhere]">
              © {year} sassblum.com — Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
