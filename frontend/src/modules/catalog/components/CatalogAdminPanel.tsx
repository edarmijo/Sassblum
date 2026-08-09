import { useState } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import { Plus, Pencil, ImagePlus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCatalogAdmin, type BeService, type BeServiceImage } from '../hooks/useCatalogAdmin'
import { useAdminEntityPanel } from '../../../core/hooks/useAdminEntityPanel'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { AdminEntityCard } from '../../../core/ui/AdminEntityCard'
import { AdminImagePicker, AdminFormActions, AdminFormCard, AdminEntityLayout } from '../../../core/ui/AdminEntityFormControls'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  categoria: '',
  imagen_url: '',
  descripcion_detalle: '',
}

export function CatalogAdminPanel() {
  const { services, loading, load, createService, editService, toggleService, deleteService, addServiceImage, deleteServiceImage } =
    useCatalogAdmin()

  const [galleryLoading, setGalleryLoading] = useState(false)
  const [actionServiceId, setActionServiceId] = useState<number | null>(null)

  const {
    submitting,
    form,
    setForm,
    imagen,
    setImagen,
    editingId,
    isEditing,
    resetForm,
    startEdit,
    handleSubmit,
  } = useAdminEntityPanel<typeof EMPTY_FORM, BeService>({
    emptyForm: EMPTY_FORM,
    formFromEntity: (s) => ({
      nombre: s.nombre,
      descripcion: s.descripcion,
      categoria: s.categoria,
      imagen_url: s.imagen_url ?? '',
      descripcion_detalle: s.descripcion_detalle ?? '',
    }),
    createFn: (f, img) => createService(f, img),
    editFn: (id, f, img) => editService(id, f, img),
    toggleFn: toggleService,
    loadFn: load,
    validate: (f) =>
      !f.nombre || !f.descripcion || !f.categoria
        ? 'Completa nombre, descripción y categoría'
        : null,
    entityLabel: 'servicio',
    descriptionFn: (f) => f.nombre,
  })

  const handleAddGalleryImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || editingId === null) return
    setGalleryLoading(true)
    try {
      await addServiceImage(editingId, file)
      await load()
      toast.success('Imagen agregada a la galería')
    } catch {
      toast.error('No se pudo agregar la imagen')
    } finally {
      setGalleryLoading(false)
      e.target.value = ''
    }
  }

  const handleDeleteGalleryImage = async (imageId: number) => {
    setGalleryLoading(true)
    try {
      await deleteServiceImage(imageId)
      await load()
      toast.success('Imagen eliminada de la galería')
    } catch {
      toast.error('No se pudo eliminar la imagen')
    } finally {
      setGalleryLoading(false)
    }
  }

  const imageInputLabel = isEditing ? 'Cambiar imagen…' : 'Seleccionar imagen…'
  const submitContent = isEditing ? (
    <>
      <Pencil className="h-4 w-4 mr-2" />
      Actualizar
    </>
  ) : (
    <>
      <Plus className="h-4 w-4 mr-2" />
      Crear servicio
    </>
  )

  const serviceBeingEdited: BeService | undefined =
    isEditing && editingId !== null ? services.find((service) => service.id === editingId) : undefined
  const galleryImages: BeServiceImage[] = serviceBeingEdited?.imagenes ?? []

  const handleServiceToggle = async (service: BeService) => {
    setActionServiceId(service.id)
    try {
      await toggleService(service.id)
      await load()
      toast.success(service.activo ? 'Servicio ocultado' : 'Servicio publicado', { description: service.nombre })
    } catch {
      toast.error('No se pudo cambiar la visibilidad del servicio')
    } finally {
      setActionServiceId(null)
    }
  }

  const handleServiceDelete = async (service: BeService) => {
    if (!window.confirm(`¿Eliminar el servicio "${service.nombre}"? Esta acción no se puede deshacer.`)) return

    setActionServiceId(service.id)
    try {
      await deleteService(service.id)
      if (editingId === service.id) resetForm()
      await load()
      toast.success('Servicio eliminado', { description: service.nombre })
    } catch {
      toast.error('No se pudo eliminar el servicio')
    } finally {
      setActionServiceId(null)
    }
  }

  let servicesList: ReactNode
  if (loading) {
    servicesList = <p className="text-gray-500">Cargando catálogo…</p>
  } else if (services.length === 0) {
    servicesList = <p className="text-gray-500">Aún no hay servicios.</p>
  } else {
    servicesList = (
      <div className="space-y-4">
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
              actionPending={actionServiceId !== null}
              onEdit={() => startEdit(s)}
              onToggle={() => void handleServiceToggle(s)}
              onDelete={() => void handleServiceDelete(s)}
            />
          ))}
        </div>

        {/* Gallery section — only shown when a service is being edited */}
        {serviceBeingEdited && (
          <div className="border border-border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Galería de imágenes</h4>
              {galleryLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {galleryImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                {galleryImages
                  .slice()
                  .sort((a, b) => a.orden - b.orden)
                  .map((img) => (
                    <div key={img.id} className="relative group aspect-square">
                      <ImageWithFallback
                        src={img.imagen_url}
                        alt={`Imagen ${img.orden + 1}`}
                        className="w-full h-full object-cover rounded-md border border-border"
                      />
                      <button
                        type="button"
                        aria-label="Eliminar imagen"
                        disabled={galleryLoading}
                        onClick={() => void handleDeleteGalleryImage(img.id)}
                        className="absolute top-0.5 right-0.5 rounded-full bg-destructive/80 text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {galleryImages.length === 0 && !galleryLoading && (
              <p className="text-xs text-muted-foreground mb-3">
                Aún no hay imágenes en la galería de este servicio.
              </p>
            )}

            {/* Add image input */}
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-600 hover:border-brand-cyan transition-colors">
              <ImagePlus className="h-4 w-4 text-brand-cyan shrink-0" />
              Agregar foto a la galería
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={galleryLoading}
                onChange={(e) => void handleAddGalleryImage(e)}
              />
            </label>
          </div>
        )}
      </div>
    )
  }

  return (
    <AdminEntityLayout
      formCard={
        <AdminFormCard
          isEditing={isEditing}
          editTitle="Editar servicio"
          createTitle="Nuevo servicio"
          editDescription="Modifica los datos del servicio"
          createDescription="Publica un servicio con su foto en el catálogo"
          onCancel={resetForm}
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="s-nombre">Nombre</Label>
            <Input
              id="s-nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-cat">Categoría</Label>
            <Input
              id="s-cat"
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              placeholder="CCTV, Domótica, Soporte…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-desc">Descripción</Label>
            <Textarea
              id="s-desc"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-desc-detalle">Descripción detallada (modal)</Label>
            <Textarea
              id="s-desc-detalle"
              rows={4}
              value={form.descripcion_detalle}
              onChange={(e) => setForm((f) => ({ ...f, descripcion_detalle: e.target.value }))}
              placeholder="Texto largo que se muestra en el modal al hacer clic…"
            />
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
        </AdminFormCard>
      }
      listArea={servicesList}
    />
  )
}
