import { createElement, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Headphones, Wifi, Printer, Server, Camera, Home as HomeIcon, Wrench, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Skeleton } from '../../../core/ui/skeleton'
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
import { EASE_APPLE } from '../../../core/ui/motion/ease'
import { useCatalog } from '../../catalog/hooks/useCatalog'
import { useAuth } from '../../auth/hooks/useAuth'

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
  const { services, isLoading, error } = useCatalog()
  const { user } = useAuth()
  const [selected, setSelected] = useState<(typeof services)[number] | null>(null)

  const ctaTo = user ? '/mis-tickets' : '/login'

  // Estado de carga / vacío precalculado — null significa "renderiza la grilla"
  let catalogFallback: React.ReactNode = null
  if (isLoading) {
    catalogFallback = (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-56 rounded-xl" />)}
      </div>
    )
  } else if (services.length === 0) {
    catalogFallback = (
      <p className="text-center" style={{ color: '#5c7a94' }}>Aún no hay servicios publicados en el catálogo.</p>
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

          {catalogFallback ?? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {services.map((s, i) => {
                const img = s.imagenUrl
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, ease: EASE_APPLE, delay: (i % 4) * 0.08 }}
                    className="group"
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className="block w-full text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
                      aria-label={`Ver detalles de ${s.nombre}`}
                    >
                      <GlowCard className="h-full">
                        <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-full border-0 shadow-none" style={{ background: 'rgba(8,22,36,0.65)', backdropFilter: 'blur(12px)' }}>
                          {img ? (
                            <div className="h-32 overflow-hidden">
                              <ImageWithFallback src={img} alt={s.nombre} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                            </div>
                          ) : (
                            <div className="h-32 flex items-center justify-center" style={{ background: 'rgba(0,196,224,0.06)' }}>
                              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(0,196,224,0.1)', border: '1px solid rgba(0,196,224,0.2)' }}>
                                <CategoryIcon categoria={s.categoria} className="h-7 w-7 text-brand-cyan" />
                              </div>
                            </div>
                          )}
                          <CardHeader>
                            <p className="text-[10px] uppercase tracking-widest text-brand-cyan">{s.categoria}</p>
                            <CardTitle style={{ color: '#eef4f8' }}>{s.nombre}</CardTitle>
                            <CardDescription style={{ color: '#5c7a94' }} className="line-clamp-2">{s.descripcion}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan transition-all group-hover:gap-2">
                              Ver detalles <ArrowRight className="h-4 w-4" />
                            </span>
                          </CardContent>
                        </Card>
                      </GlowCard>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 py-16" style={{ background: 'rgba(0,196,224,0.04)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4 font-semibold" style={{ color: '#eef4f8' }}>¿Necesitas alguno de estos servicios?</h2>
          <p className="mb-8" style={{ color: '#5c7a94' }}>
            {user ? 'Crea un ticket y nuestro equipo te contactará pronto' : 'Regístrate para crear un ticket y nuestro equipo te contactará pronto'}
          </p>
          <Button asChild size="lg" className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
            <Link to={ctaTo}>{user ? 'Crear ticket' : 'Registrarse ahora'}</Link>
          </Button>
        </div>
      </div>

      {/* Modal de detalle del servicio */}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0" style={{ background: 'rgba(8,22,36,0.95)', border: '1px solid rgba(0,196,224,0.2)', backdropFilter: 'blur(24px)' }}>
          {selected && (
            <>
              {selected.imagenUrl ? (
                <div className="h-52 overflow-hidden">
                  <ImageWithFallback src={selected.imagenUrl} alt={selected.nombre} className="w-full h-full object-cover" />
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
                  <DialogDescription className="text-base leading-relaxed mt-2" style={{ color: '#5c7a94' }}>
                    {selected.descripcion}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6">
                  <Button asChild size="lg" className="w-full sm:w-auto bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
                    <Link to={ctaTo}>{user ? 'Solicitar servicio' : 'Inicia sesión para solicitar'}</Link>
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
