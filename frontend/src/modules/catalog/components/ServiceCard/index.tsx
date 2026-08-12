import { ArrowRight, Eye } from 'lucide-react'
import { GlowCard } from '../../../../core/ui/GlowCard'
import { ImageWithFallback } from '../../../../core/ui/ImageWithFallback'
import { env } from '../../../../infrastructure/config/env'
import type { ServiceSummary } from '../../interfaces/ICatalogService'

interface ServiceCardProps {
  service: ServiceSummary
  onSelect?: (id: string) => void
  onViewDetails?: (id: string) => void
}

/**
 * SRP: renders one service card.
 * DIP: depends on ServiceSummary interface only.
 *
 * Click behaviour:
 *  - If onViewDetails is provided → clicking the card opens the gallery modal (onViewDetails).
 *    A secondary "Crear ticket" button still calls onSelect directly for keyboard/accessibility.
 *  - If onViewDetails is NOT provided → clicking the card calls onSelect directly
 *    (backwards-compatible; "Crear ticket" link replaces the details CTA).
 */
export function ServiceCard({ service, onSelect, onViewDetails }: Readonly<ServiceCardProps>) {
  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(service.id)
    } else {
      onSelect?.(service.id)
    }
  }

  return (
    <GlowCard className="bg-card border border-border shadow-sm hover:shadow-lg transition-shadow duration-500">
      <div className="p-2.5 rounded-xl">
        {/* Main clickable area — opens modal when onViewDetails is set */}
        <button
          type="button"
          onClick={handleCardClick}
          className="group text-left w-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <div className="mb-2.5 aspect-[16/9] overflow-hidden rounded-lg bg-muted">
            <ImageWithFallback
              src={service.imagenUrl}
              optimizedWidth={640}
              optimizationEnabled={env.imageTransformsEnabled}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              alt={`Imagen de ${service.nombre}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="text-xs font-semibold text-foreground group-hover:text-brand-cyan-dark transition-colors duration-300 line-clamp-1">
              {service.nombre}
            </h3>
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 shrink-0">
              {service.categoria}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{service.descripcion}</p>

          {/* CTA label changes depending on whether a modal handler is wired */}
          {onViewDetails ? (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-brand-cyan-dark">
              Ver detalles
              <Eye className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-brand-cyan-dark">
              Crear ticket
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </button>

        {/* Secondary "Crear ticket" button — only visible when modal is wired */}
        {onViewDetails && onSelect && (
          <button
            type="button"
            onClick={() => onSelect(service.id)}
            className="inline-flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-brand-cyan-dark transition-colors duration-200 cursor-pointer"
          >
            Crear ticket
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    </GlowCard>
  )
}
