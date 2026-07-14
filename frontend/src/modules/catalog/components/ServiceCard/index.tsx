import { ArrowRight } from 'lucide-react'
import { GlowCard } from '../../../../core/ui/GlowCard'
import type { ServiceSummary } from '../../interfaces/ICatalogService'

interface ServiceCardProps {
  service: ServiceSummary
  onSelect?: (id: string) => void
}

/**
 * SRP: renders one service card.
 * DIP: depends on ServiceSummary type only.
 * Futurista: GlowCard 3D tilt + glow effect que sigue al cursor.
 */
export function ServiceCard({ service, onSelect }: Readonly<ServiceCardProps>) {
  return (
    <GlowCard className="bg-card border border-border shadow-sm hover:shadow-lg transition-shadow duration-500">
      <button
        type="button"
        onClick={() => onSelect?.(service.id)}
        className="group text-left w-full p-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="text-xs font-semibold text-foreground group-hover:text-brand-cyan-dark transition-colors duration-300 line-clamp-1">
            {service.nombre}
          </h3>
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 shrink-0">
            {service.categoria}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{service.descripcion}</p>
        <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-brand-cyan-dark">
          Crear ticket
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    </GlowCard>
  )
}
