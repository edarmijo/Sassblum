import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, ImagePlus, Loader2, X, Power } from 'lucide-react'
import { useCatalogAdmin, type BeService } from '../hooks/useCatalogAdmin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { Badge } from '../../../core/ui/badge'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'

/**
 * Admin/worker catalog management with create + EDIT + toggle active.
 * DIP: depends on useCatalogAdmin hook (interface), not on apiClient directly.
 * SRP: only renders UI and delegates API calls to the hook.
 *
 * H#2 (cliente): Added edit functionality so admin can modify existing services.
 */
export function CatalogAdminPanel() {
  const { services, loading, load, createService, editService, toggleService } = useCatalogAdmin()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', categoria: '', imagen_url: '' })
  const [imagen, setImagen] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const isEditing = editingId !== null

  const resetForm = () => {
    setForm({ nombre: '', descripcion: '', categoria: '', imagen_url: '' })
    setImagen(null)
    setEditingId(null)
  }

  const startEdit = (service: BeService) => {
    setForm({ nombre: service.nombre, descripcion: service.descripcion, categoria: service.categoria, imagen_url: service.imagen_url ?? '' })
    setImagen(null)
    setEditingId(service.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.descripcion || !form.categoria) {
      toast.error('Completa nombre, descripción y categoría')
      return
    }
    setSubmitting(true)
    try {
      if (isEditing) {
        await editService(editingId as number, form, imagen)
        toast.success('Servicio actualizado', { description: form.nombre })
      } else {
        await createService(form, imagen)
        toast.success('Servicio creado', { description: form.nombre })
      }
      resetForm()
      await load()
    } catch {
      toast.error(editingId ? 'No se pudo actualizar el servicio' : 'No se pudo crear el servicio')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await toggleService(id)
      await load()
    } catch {
      toast.error('No se pudo cambiar el estado del servicio')
    }
  }

  const imageInputLabel = isEditing ? 'Cambiar imagen…' : 'Seleccionar imagen…'
  const submitContent = isEditing
    ? <><Pencil className="h-4 w-4 mr-2" />Actualizar</>
    : <><Plus className="h-4 w-4 mr-2" />Crear servicio</>

  let servicesList: React.ReactNode
  if (loading) {
    servicesList = <p className="text-gray-500">Cargando catálogo…</p>
  } else if (services.length === 0) {
    servicesList = <p className="text-gray-500">Aún no hay servicios.</p>
  } else {
    servicesList = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((s) => (
          <Card key={s.id} className={`overflow-hidden transition-opacity ${editingId === s.id ? 'ring-2 ring-brand-cyan' : ''}`}>
            <div className="h-32 overflow-hidden bg-brand-navy/5">
              <ImageWithFallback src={s.imagen_url} alt={s.nombre} className="w-full h-full object-cover" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{s.nombre}</CardTitle>
                <Badge className={s.activo ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <CardDescription className="line-clamp-2">{s.descripcion}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-brand-cyan">{s.categoria}</span>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => startEdit(s)}
                    aria-label={`Editar ${s.nombre}`}
                  >
                    <Pencil className="h-3 w-3 mr-1" />Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2 text-xs ${s.activo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                    onClick={() => void handleToggle(s.id)}
                    aria-label={s.activo ? `Desactivar ${s.nombre}` : `Activar ${s.nombre}`}
                  >
                    <Power className="h-3 w-3 mr-1" />{s.activo ? 'Off' : 'On'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form — create or edit mode */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isEditing ? 'Editar servicio' : 'Nuevo servicio'}</CardTitle>
              <CardDescription>
                {isEditing ? 'Modifica los datos del servicio' : 'Publica un servicio con su foto en el catálogo'}
              </CardDescription>
            </div>
            {isEditing && (
              <Button type="button" variant="ghost" size="icon" onClick={resetForm} aria-label="Cancelar edición">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-nombre">Nombre</Label>
              <Input id="s-nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-cat">Categoría</Label>
              <Input id="s-cat" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} placeholder="CCTV, Domótica, Soporte…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Descripción</Label>
              <Textarea id="s-desc" rows={4} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-url">URL de imagen</Label>
              <Input id="s-url" value={form.imagen_url} onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-img">{isEditing ? '…o sube una nueva foto' : '…o sube una foto'}</Label>
              <label htmlFor="s-img" className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-brand-cyan">
                <ImagePlus className="h-4 w-4 text-brand-cyan" />
                {imagen ? imagen.name : imageInputLabel}
              </label>
              <input id="s-img" type="file" accept="image/*" className="hidden" onChange={(e) => setImagen(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1 bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitContent}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List with edit + toggle buttons */}
      <div className="lg:col-span-2">
        {servicesList}
      </div>
    </div>
  )
}
