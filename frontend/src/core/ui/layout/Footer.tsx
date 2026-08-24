import { Mail, MapPin, Phone } from 'lucide-react'
import { SmoothLink as Link } from '../SmoothLink'

const serviceLinks = [
  'Infraestructura IT',
  'Soporte Técnico',
  'Cableado Estructurado',
] as const

const additionalLinks = ['Sistema CCTV', 'Domótica', 'Servidores'] as const

// Brand paths adapted from Bootstrap Icons 1.13.1 (MIT): https://icons.getbootstrap.com/
const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/sass.blum/',
    iconPath:
      'M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/sassblum-consultor%C3%ADa-seguridad-inform%C3%A1tica-ab7a72165',
    iconPath:
      'M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/sassblum/',
    iconPath:
      'M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334',
  },
] as const

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
                    <p className="flex min-h-11 max-w-full min-w-0 items-center gap-2 py-2 font-display text-[0.9rem] leading-snug text-[#c3d2e3]">
                      <MapPin aria-hidden="true" className="size-4 shrink-0" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        Guayaquil - Ecuador
                      </span>
                    </p>
                  </li>
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
                    <a href="tel:+593995286319" className={navigationLinkClassName}>
                      <Phone aria-hidden="true" className="size-4 shrink-0" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        +593 99 528 6319
                      </span>
                    </a>
                  </li>
                  {socialLinks.map(({ label, href, iconPath }) => (
                    <li key={label} className="min-w-0">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={navigationLinkClassName}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          className="size-4 shrink-0 fill-current transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                        >
                          <path d={iconPath} />
                        </svg>
                        <span>{label}</span>
                        <span className="sr-only">(se abre en una pestaña nueva)</span>
                      </a>
                    </li>
                  ))}
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
