import { Pencil, Power, Trash2 } from 'lucide-react'
import type { ClientLogo } from '../interfaces/IClientLogoService'
import { Button } from '../../../core/ui/button'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'

interface ClientLogoCardProps {
  logo: ClientLogo
  isSelected: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

/** Presentational card for one client logo in the admin inventory. */
export function ClientLogoCard({ logo, isSelected, onEdit, onToggle, onDelete }: Readonly<ClientLogoCardProps>) {
  return (
    <article
      className={`overflow-hidden rounded-xl border transition-colors ${
        isSelected ? 'border-brand-cyan ring-1 ring-brand-cyan/70' : 'border-border bg-card'
      }`}
    >
      <div className="relative flex h-32 items-center justify-center bg-white p-5">
        <ImageWithFallback src={logo.logoUrl} sizes="160px" alt={`Logotipo de ${logo.nombre}`} className="h-full w-full object-contain" />
        <span className="absolute right-2 top-2 rounded-full bg-brand-navy/90 px-2 py-0.5 text-[10px] font-semibold text-white">
          #{logo.orden}
        </span>
      </div>
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">{logo.nombre}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${logo.activo ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
            {logo.activo ? 'Visible' : 'Oculto'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />Editar
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onToggle}>
            <Power className="mr-1 h-3 w-3" />{logo.activo ? 'Ocultar' : 'Mostrar'}
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="mr-1 h-3 w-3" />Eliminar
          </Button>
        </div>
      </div>
    </article>
  )
}
