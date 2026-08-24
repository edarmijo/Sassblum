import { createElement, useState } from 'react'
import { Headphones, Wifi, Printer, Server, Camera, Home as HomeIcon, Wrench, ArrowRight, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Skeleton } from '../../../core/ui/skeleton'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'
import { GlowCard } from '../../../core/ui/GlowCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../core/ui/dialog'
import { PageHero } from '../../../core/ui/layout/PageHero'
import { Reveal, RevealGroup, RevealItem } from '../../../core/ui/motion'
import { useCatalog } from '../../catalog/hooks/useCatalog'
import { useAuth } from '../../auth/hooks/useAuth'
import { env } from '../../../infrastructure/config/env'
import { SmoothLink as Link } from '../../../core/ui/SmoothLink'

const CATEGORY_ICON: Record<string, typeof Wrench> = {
  soporte: Headphones,
  'wi-fi': Wifi,
  wifi: Wifi,
  redes: Wifi,
  impresoras: Printer,
  infraestructura: Server,
  servidores: Server,
  cctv: Camera,
  seguridad: Camera,
  domotica: HomeIcon,
  'domótica': HomeIcon,
}

function iconFor(categoria: string) {
  const key = categoria?.toLowerCase().trim()
  return CATEGORY_ICON[key] ?? Wrench
}

// Claves estables para los skeletons (evita usar el índice del array como key)
const SKELETON_KEYS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`)

function CategoryIcon({ categoria, className }: { categoria: string; className?: string }) {
  return createElement(iconFor(categoria), { className })
}

export function Services() {
  const { services, isLoading, error, setFilters } = useCatalog()
  const { user } = useAuth()
  const [selected, setSelected] = useState<(typeof services)[number] | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const ticketTarget = (serviceId?: string) => {
    const params = new URLSearchParams({ tab: 'create' })
    if (serviceId) params.set('servicio', serviceId)
    return `/mis-tickets?${params.toString()}`
  }
  const accessTarget = (serviceId?: string) => {
    const target = ticketTarget(serviceId)
    return user ? target : `/login?next=${encodeURIComponent(target)}`
  }
  const ctaTo = accessTarget()
  const hasFilters = search.trim() !== '' || category.trim() !== ''
  const updateFilters = (next: { search?: string; category?: string }) => {
    const nextSearch = next.search ?? search
    const nextCategory = next.category ?? category
    setSearch(nextSearch)
    setCategory(nextCategory)
    setFilters({
      busqueda: nextSearch.trim() || undefined,
      categoria: nextCategory.trim() || undefined,
    })
  }
  const clearFilters = () => updateFilters({ search: '', category: '' })
  const selectedGallery = selected
    ? selected.imagenes
        .slice()
        .sort((a, b) => a.orden - b.orden)
    : []

  // Estado de carga / vacío precalculado — null significa "renderiza la grilla"
  let catalogFallback: React.ReactNode = null
  if (isLoading) {
    catalogFallback = (
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-56 rounded-xl" />)}
      </div>
    )
  } else if (services.length === 0) {
    catalogFallback = (
      <div className="flex flex-col items-center gap-4 py-8 text-center" role="status" aria-live="polite">
        <p style={{ color: '#9bbdce' }}>
          {hasFilters
            ? 'No encontramos servicios con esa búsqueda o categoría.'
            : 'Aún no hay servicios publicados en el catálogo.'}
        </p>
        {hasFilters && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Catálogo"
        title="Servicios"
        subtitle="Soluciones tecnológicas integrales para tu empresa"
        accent="cyan"
        orbPosition="top-right"
      />

      {/* Services grid */}
      <div className="relative z-10 py-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && <p className="text-center text-red-400 mb-8">{error}</p>}

          <section
            aria-label="Buscar y filtrar servicios"
            className="mb-6 grid gap-3 rounded-xl border border-brand-cyan/15 bg-[#081624]/85 p-4 sm:grid-cols-2"
          >
            <div className="min-w-0 space-y-2">
              <Label htmlFor="service-search">Buscar servicio</Label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9bbdce]" />
                <Input
                  id="service-search"
                  type="search"
                  value={search}
                  onChange={(event) => updateFilters({ search: event.target.value })}
                  className="h-11 pl-10"
                  placeholder="Nombre o descripción"
                />
              </div>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="service-category">Categoría</Label>
              <Input
                id="service-category"
                value={category}
                onChange={(event) => updateFilters({ category: event.target.value })}
                className="h-11"
                placeholder="Ej.: soporte, redes, CCTV"
              />
            </div>
          </section>

          {catalogFallback ?? (
            <RevealGroup className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {services.map((s) => {
                const img = s.imagenUrl
                return (
                  <RevealItem
                    key={s.id}
                    className="group"
                    focus
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className="block w-full text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
                      aria-label={`Ver detalles de ${s.nombre}`}
                    >
                      <GlowCard className="h-full">
                        <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-full border-0 shadow-none" style={{ background: 'rgba(8,22,36,0.92)' }}>
                          {img ? (
                            <div className="h-32 overflow-hidden">
                              <ImageWithFallback
                                src={img}
                                optimizedWidth={640}
                                optimizationEnabled={env.imageTransformsEnabled}
                                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
                                alt={s.nombre}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                              />
                            </div>
                          ) : (
                            <div className="h-32 flex items-center justify-center" style={{ background: 'rgba(0,196,224,0.06)' }}>
                              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(0,196,224,0.1)', border: '1px solid rgba(0,196,224,0.2)' }}>
                                <CategoryIcon categoria={s.categoria} className="h-7 w-7 text-brand-cyan" />
                              </div>
                            </div>
                          )}
                          <CardHeader>
                            <p className="text-xs uppercase tracking-widest text-brand-cyan">{s.categoria}</p>
                            <CardTitle style={{ color: '#eef4f8' }}>{s.nombre}</CardTitle>
                            <CardDescription style={{ color: '#7aa3b8' }} className="line-clamp-2">{s.descripcion}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan transition-all group-hover:gap-2">
                              Ver detalles <ArrowRight className="h-4 w-4" />
                            </span>
                          </CardContent>
                        </Card>
                      </GlowCard>
                    </button>
                  </RevealItem>
                )
              })}
            </RevealGroup>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 py-16" style={{ background: 'rgba(0,196,224,0.04)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal y={20}>
            <h2 className="text-3xl mb-4 font-semibold" style={{ color: '#eef4f8' }}>¿Necesitas alguno de estos servicios?</h2>
            <p className="mb-8" style={{ color: '#7aa3b8' }}>
              {user ? 'Crea un ticket y nuestro equipo te contactará pronto' : 'Regístrate para crear un ticket y nuestro equipo te contactará pronto'}
            </p>
            <Button asChild size="lg" className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
              <Link to={ctaTo}>{user ? 'Crear ticket' : 'Inicia sesión o regístrate'}</Link>
            </Button>
          </Reveal>
        </div>
      </div>

      {/* Modal de detalle del servicio */}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl p-0 gap-0 [&>button]:right-2 [&>button]:top-2 [&>button]:flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center [&>button]:bg-[#081624]/90 [&>button]:opacity-100" style={{ background: 'rgba(8,22,36,0.97)', border: '1px solid rgba(0,196,224,0.2)' }}>
          {selected && (
            <>
              {selected.imagenUrl ? (
                <div className="h-44 overflow-hidden sm:h-52">
                  <ImageWithFallback
                    src={selected.imagenUrl}
                    sizes="(max-width: 640px) 100vw, 576px"
                    alt={selected.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center" style={{ background: 'rgba(0,196,224,0.06)' }}>
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ background: 'rgba(0,196,224,0.1)', border: '1px solid rgba(0,196,224,0.3)' }}>
                    <CategoryIcon categoria={selected.categoria} className="h-10 w-10 text-brand-cyan" />
                  </div>
                </div>
              )}
              <div className="p-6">
                <DialogHeader>
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-1" style={{ color: '#00c4e0' }}>{selected.categoria}</p>
                  <DialogTitle className="text-2xl" style={{ color: '#eef4f8' }}>{selected.nombre}</DialogTitle>
                </DialogHeader>
                {selectedGallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-5">
                    {selectedGallery.map((image) => (
                      <div key={image.id} className="aspect-[4/3] overflow-hidden rounded-md border border-white/10">
                        <ImageWithFallback
                          src={image.imagenUrl}
                          sizes="(max-width: 640px) 50vw, 192px"
                          alt={`${selected.nombre}, imagen ${image.orden + 1}`}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <DialogDescription className="text-base leading-relaxed mt-5" style={{ color: '#7aa3b8' }}>
                  {selected.descripcionDetalle || selected.descripcion}
                </DialogDescription>
                <DialogFooter className="mt-6">
                  <Button asChild size="lg" className="w-full sm:w-auto bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
                    <Link to={accessTarget(selected.id)}>{user ? 'Solicitar servicio' : 'Inicia sesión para solicitar'}</Link>
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
