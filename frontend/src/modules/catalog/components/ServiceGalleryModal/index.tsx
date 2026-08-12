/**
 * ServiceGalleryModal — displays service detail with image gallery and CTA.
 * SRP: presentational modal only; data comes from the caller.
 * DIP: depends on ServiceSummary interface, not on any service class.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../core/ui/dialog'
import { ImageWithFallback } from '../../../../core/ui/ImageWithFallback'
import { Button } from '../../../../core/ui/button'
import type { ServiceSummary } from '../../interfaces/ICatalogService'

interface ServiceGalleryModalProps {
  service: ServiceSummary
  onClose: () => void
  onCreateTicket: () => void
}

/**
 * Renders a modal with the service's image gallery, detailed description,
 * and a "Crear ticket" CTA button.
 * The Radix × button is included automatically by DialogContent.
 */
export function ServiceGalleryModal({
  service,
  onClose,
  onCreateTicket,
}: Readonly<ServiceGalleryModalProps>) {
  const images = [
    ...(service.imagenUrl
      ? [{ id: 0, imagenUrl: service.imagenUrl, orden: -1 }]
      : []),
    ...service.imagenes,
  ]
  const bodyText =
    service.descripcionDetalle !== '' ? service.descripcionDetalle : service.descripcion

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle>{service.nombre}</DialogTitle>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0">
              {service.categoria}
            </span>
          </div>
        </DialogHeader>

        {/* Image gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {images
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((img) => (
                <div
                  key={img.id}
                  className="aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <ImageWithFallback
                    src={img.imagenUrl}
                    sizes="(max-width: 640px) 33vw, 180px"
                    alt={`${service.nombre} imagen ${img.orden + 2}`}
                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                  />
                </div>
              ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-line">
          {bodyText}
        </p>

        <DialogFooter>
          <Button onClick={onCreateTicket}>Crear ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
