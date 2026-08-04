import type { ReactNode } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import { useCatalogAdmin, type BeService } from '../hooks/useCatalogAdmin'
import { useAdminEntityPanel } from '../../../core/hooks/useAdminEntityPanel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { AdminEntityCard } from '../../../core/ui/AdminEntityCard'
import { AdminImagePicker, AdminFormActions } from '../../../core/ui/AdminEntityFormControls'

const EMPTY_FORM = { nombre: '', descripcion: '', categoria: '', imagen_url: '' }

export function CatalogAdminPanel() {
  const { services, loading, load, createService, editService, toggleService } = useCatalogAdmin()

  const { submitting, form, setForm, imagen, setImagen, editingId, isEditing, resetForm, startEdit, handleSubmit, handleToggle } =
    useAdminEntityPanel<typeof EMPTY_FORM, BeService>({
      emptyForm: EMPTY_FORM,
      formFromEntity: (s) => ({ nombre: s.nombre, descripcion: s.descripcion, categoria: s.categoria, imagen_url: s.imagen_url ?? '' }),
      createFn: (f, img) => createService(f, img),
      editFn: (id, f, img) => editService(id, f, img),
      toggleFn: toggleService,
      loadFn: load,
      validate: (f) => (!f.nombre || !f.descripcion || !f.categoria) ? 'Completa nombre, descripción y categoría' : null,
      entityLabel: 'servicio',
      descriptionFn: (f) => f.nombre,
    })

  const imageInputLabel = isEditing ? 'Cambiar imagen…' : 'Seleccionar imagen…'
  const submitContent = isEditing
    ? <><Pencil className="h-4 w-4 mr-2" />Actualizar</>
    : <><Plus className="h-4 w-4 mr-2" />Crear servicio</>

  let servicesList: ReactNode
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

      <div className="lg:col-span-2">
        {servicesList}
      </div>
    </div>
  )
}
