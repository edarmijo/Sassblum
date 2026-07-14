import { Pencil, Power } from 'lucide-react'
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
  onEdit: () => void
  onToggle: () => void
}

/**
 * Tarjeta de entidad para paneles de administración (catálogo, galería).
 * SRP: solo presenta la entidad y delega editar/activar vía callbacks.
 * DRY: compartida por CatalogAdminPanel y GalleryAdminPanel (eran espejos).
 */
export function AdminEntityCard({
  titulo, descripcion, etiqueta, imagenUrl, activo, resaltada = false, onEdit, onToggle,
}: Readonly<AdminEntityCardProps>) {
  return (
    <Card className={`overflow-hidden transition-opacity ${resaltada ? 'ring-2 ring-brand-cyan' : ''}`}>
      <div className="h-32 overflow-hidden bg-brand-navy/5">
        <ImageWithFallback src={imagenUrl} alt={titulo} className="w-full h-full object-cover" />
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
          <span className="text-[10px] uppercase tracking-widest text-brand-cyan">{etiqueta}</span>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onEdit}
              aria-label={`Editar ${titulo}`}
            >
              <Pencil className="h-3 w-3 mr-1" />Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-7 px-2 text-xs ${activo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
              onClick={onToggle}
              aria-label={activo ? `Desactivar ${titulo}` : `Activar ${titulo}`}
            >
              <Power className="h-3 w-3 mr-1" />{activo ? 'Off' : 'On'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
