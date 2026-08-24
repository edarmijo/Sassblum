import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_ORIGIN = 'https://www.sassblum.com'

interface PublicPageMetadata {
  readonly title: string
  readonly description: string
}

const PUBLIC_PAGES: Readonly<Record<string, PublicPageMetadata>> = {
  '/': {
    title: 'SassBlum — Innovación Tecnológica',
    description: 'Soluciones tecnológicas, soporte y servicios especializados para empresas en Ecuador.',
  },
  '/nosotros': {
    title: 'Nosotros | SassBlum',
    description: 'Conoce a SassBlum y nuestro compromiso con soluciones tecnológicas confiables para empresas.',
  },
  '/servicios': {
    title: 'Servicios tecnológicos | SassBlum',
    description: 'Explora los servicios tecnológicos, soporte y soluciones empresariales de SassBlum.',
  },
  '/galeria': {
    title: 'Proyectos | SassBlum',
    description: 'Conoce proyectos y soluciones tecnológicas desarrolladas por SassBlum.',
  },
  '/clientes': {
    title: 'Clientes | SassBlum',
    description: 'Empresas que confían en las soluciones y servicios tecnológicos de SassBlum.',
  },
}

function normalizedPath(pathname: string): string {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '')
}

function upsertMeta(selector: string, attributes: Readonly<Record<string, string>>): HTMLMetaElement {
  const current = document.head.querySelector<HTMLMetaElement>(selector)
  const element = current ?? document.createElement('meta')

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }

  if (!current) document.head.append(element)
  return element
}

function removeElement(selector: string): void {
  document.head.querySelector(selector)?.remove()
}

/** Keeps search metadata aligned with the current SPA route. */
export function RouteMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = normalizedPath(pathname)
    const metadata = PUBLIC_PAGES[path]

    if (!metadata) {
      document.title = 'SassBlum — Gestión de Tickets'
      upsertMeta('meta[name="robots"]', { name: 'robots', content: 'noindex, nofollow' })
      removeElement('link[rel="canonical"]')
      removeElement('meta[property="og:url"]')
      return
    }

    const canonicalUrl = `${SITE_ORIGIN}${path}`
    document.title = metadata.title
    upsertMeta('meta[name="description"]', { name: 'description', content: metadata.description })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: metadata.title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: metadata.description })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })

    const currentCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const canonical = currentCanonical ?? document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = canonicalUrl
    if (!currentCanonical) document.head.append(canonical)
  }, [pathname])

  return null
}
