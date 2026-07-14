import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, X } from 'lucide-react'
import { useCatalogAdmin, type BeService } from '../hooks/useCatalogAdmin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { AdminEntityCard } from '../../../core/ui/AdminEntityCard'
import { AdminImagePicker, AdminFormActions } from '../../../core/ui/AdminEntityFormControls'

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
          <AdminEntityCard
            key={s.id}
            titulo={s.nombre}
            descripcion={s.descripcion}
            etiqueta={s.categoria}
            imagenUrl={s.imagen_url}
            activo={s.activo}
            resaltada={editingId === s.id}
            onEdit={() => startEdit(s)}
            onToggle={() => void handleToggle(s.id)}
          />
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
            <AdminImagePicker
              idPrefix="s"
              urlValue={form.imagen_url}
              onUrlChange={(v) => setForm((f) => ({ ...f, imagen_url: v }))}
              fileLabel={isEditing ? '…o sube una nueva foto' : '…o sube una foto'}
              filePlaceholder={imageInputLabel}
              fileName={imagen?.name}
              onFileChange={setImagen}
            />
            <AdminFormActions
              submitting={submitting}
              submitContent={submitContent}
              isEditing={isEditing}
              onCancel={resetForm}
            />
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
