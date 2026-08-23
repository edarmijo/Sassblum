import { Pencil, Power, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { ImageWithFallback } from './ImageWithFallback'

interface AdminEntityCardProps {
  titulo: string
  descripcion: string
  etiqueta: string
  imagenUrl?: string
  activo: boolean
  resaltada?: boolean
  actionPending?: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

/**
 * Tarjeta de entidad para paneles de administración (catálogo, galería).
 * SRP: solo presenta la entidad y delega editar/activar vía callbacks.
 * DRY: compartida por CatalogAdminPanel y GalleryAdminPanel (eran espejos).
 */
export function AdminEntityCard({
  titulo, descripcion, etiqueta, imagenUrl, activo, resaltada = false, actionPending = false, onEdit, onToggle, onDelete,
}: Readonly<AdminEntityCardProps>) {
  return (
    <Card className={`overflow-hidden transition-opacity ${resaltada ? 'ring-2 ring-brand-cyan' : ''}`}>
      <div className="h-32 overflow-hidden bg-brand-navy/5">
        <ImageWithFallback src={imagenUrl} sizes="(max-width: 640px) 100vw, 320px" alt={titulo} className="w-full h-full object-cover" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{titulo}</CardTitle>
          <Badge className={activo ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
        </div>
        <CardDescription className="line-clamp-2">{descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-brand-cyan">{etiqueta}</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onEdit}
              disabled={actionPending}
              aria-label={`Editar ${titulo}`}
            >
              <Pencil className="h-3 w-3 mr-1" />Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onToggle}
              disabled={actionPending}
              aria-label={activo ? `Ocultar ${titulo}` : `Mostrar ${titulo}`}
            >
              <Power className="h-3 w-3 mr-1" />{activo ? 'Ocultar' : 'Mostrar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={actionPending}
              aria-label={`Eliminar ${titulo}`}
            >
              <Trash2 className="h-3 w-3 mr-1" />Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
