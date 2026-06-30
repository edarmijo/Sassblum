import { useState } from 'react'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import type { ServiceFilterOptions } from '../../interfaces/ICatalogService'

interface ServiceFilterProps {
  onChange: (filters: ServiceFilterOptions) => void
}

/** SRP: emit catalog filter changes (categoría + búsqueda) using core UI components. */
export function ServiceFilter({ onChange }: ServiceFilterProps) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')

  const emit = (next: Partial<{ busqueda: string; categoria: string }>) => {
    const merged = { busqueda, categoria, ...next }
    onChange({
      busqueda: merged.busqueda || undefined,
      categoria: merged.categoria || undefined,
    })
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-50 space-y-1.5">
        <Label htmlFor="sf-busqueda">Buscar</Label>
        <Input
          id="sf-busqueda"
          type="search"
          placeholder="Buscar servicio…"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); emit({ busqueda: e.target.value }) }}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sf-categoria">Categoría</Label>
        <Input
          id="sf-categoria"
          type="text"
          placeholder="Categoría"
          value={categoria}
          onChange={(e) => { setCategoria(e.target.value); emit({ categoria: e.target.value }) }}
        />
      </div>
    </div>
  )
}
