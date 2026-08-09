import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Loader2, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../core/ui/button'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { useCatalogAdmin, type BeService } from '../hooks/useCatalogAdmin'

/** Keeps the public service modal's long-form copy and extra images manageable. */
export function ServiceDetailAdminPanel() {
  const { services, loading, load, editService, addServiceImage, deleteServiceImage } = useCatalogAdmin()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedId),
    [selectedId, services],
  )

  useEffect(() => {
    if (selectedId !== null && !selectedService) setSelectedId(null)
  }, [selectedId, selectedService])

  useEffect(() => {
    setDetail(selectedService?.descripcion_detalle ?? '')
    setActionError(null)
  }, [selectedService])

  const payloadFor = (service: BeService, descripcionDetalle: string) => ({
    nombre: service.nombre,
    descripcion: service.descripcion,
    categoria: service.categoria,
    imagen_url: service.imagen_url ?? '',
    descripcion_detalle: descripcionDetalle,
  })

  const saveDetail = async () => {
    if (!selectedService) return
    setIsSaving(true)
    setActionError(null)
    try {
      await editService(selectedService.id, payloadFor(selectedService, detail))
      await load()
      toast.success('Descripción del servicio actualizada')
    } catch {
      const message = 'No se pudo guardar la descripción. Inténtalo nuevamente.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const uploadImage = async (file: File | undefined) => {
    if (!file || !selectedService) return
    setIsUploading(true)
    setActionError(null)
    try {
      await addServiceImage(selectedService.id, file)
      await load()
      toast.success('Imagen agregada al detalle del servicio')
    } catch {
      const message = 'No se pudo subir la imagen. Verifica el archivo e inténtalo nuevamente.'
      setActionError(message)
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = async (imageId: number) => {
    setDeletingImageId(imageId)
    setActionError(null)
    try {
      await deleteServiceImage(imageId)
      await load()
      toast.success('Imagen eliminada del detalle')
    } catch {
      const message = 'No se pudo eliminar la imagen. Inténtalo nuevamente.'
      setActionError(message)
      toast.error(message)
    } finally {
      setDeletingImageId(null)
    }
  }

  if (loading) {
    return <div className="flex min-h-56 items-center justify-center text-muted-foreground" role="status"><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />Cargando servicios…</div>
  }

  if (services.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">Aún no hay servicios para detallar</h2>
        <p className="mt-2 text-sm text-muted-foreground">Crea un servicio desde Catálogo y vuelve aquí para añadir su descripción e imágenes.</p>
      </section>
    )
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.7fr)]">
      <aside className="rounded-xl border border-border bg-card p-4 xl:sticky xl:top-6 xl:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">Detalle público</p>
        <h2 className="mt-1 text-xl font-semibold">Servicios</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Elige una ficha para mantener su texto e imágenes complementarias.</p>
        <div className="mt-4 space-y-2" role="list" aria-label="Servicios disponibles">
          {services.map((service) => {
            const isSelected = service.id === selectedId
            return (
              <button key={service.id} type="button" onClick={() => setSelectedId(service.id)} aria-pressed={isSelected} className={`w-full rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan ${isSelected ? 'border-brand-cyan bg-brand-cyan/10 text-foreground' : 'border-transparent bg-muted/35 hover:border-border hover:bg-muted/60'}`}>
                <span className="block truncate font-medium">{service.nombre}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{service.categoria}</span>
              </button>
            )
          })}
        </div>
      </aside>

      {!selectedService ? (
        <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 p-8 text-center">
          <div><h2 className="text-lg font-semibold">Elige un servicio</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Sus fotos y descripción detallada aparecerán aquí para que puedas gestionarlas.</p></div>
        </div>
      ) : (
        <div className="space-y-6">
          <header className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">Ficha seleccionada</p><h2 className="mt-1 text-2xl font-semibold">{selectedService.nombre}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedService.categoria}</p></div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedService.activo ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-800 dark:text-amber-200'}`}>{selectedService.activo ? 'Visible en el catálogo' : 'Oculto en el catálogo'}</span>
          </header>

          {actionError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{actionError}</div>}

          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold">Descripción del detalle</h3>
            <p className="mt-1 text-sm text-muted-foreground">Se muestra debajo de las imágenes al abrir este servicio.</p>
            <Label className="sr-only" htmlFor="service-detail-description">Descripción detallada</Label>
            <Textarea id="service-detail-description" value={detail} onChange={(event) => setDetail(event.target.value)} rows={8} className="mt-4 min-h-44" placeholder="Explica el alcance, los beneficios y lo que incluye este servicio…" />
            <div className="mt-4 flex justify-end"><Button type="button" onClick={() => void saveDetail()} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}Guardar descripción</Button></div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h3 className="font-semibold">Galería del servicio</h3><p className="mt-1 text-sm text-muted-foreground">Estas fotos se muestran junto a la imagen principal al abrir el servicio.</p></div>
              <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-brand-cyan px-3 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-cyan-dark focus-within:ring-2 focus-within:ring-brand-cyan focus-within:ring-offset-2">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />}Añadir imagen
                <input type="file" accept="image/*" className="sr-only" disabled={isUploading} onChange={(event) => { void uploadImage(event.target.files?.[0]); event.target.value = '' }} />
              </label>
            </div>

            {(selectedService.imagenes ?? []).length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">Aún no hay imágenes extra. Añade fotografías que ilustren este servicio.</div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(selectedService.imagenes ?? []).slice().sort((first, second) => first.orden - second.orden).map((image, index) => {
                  const isDeleting = deletingImageId === image.id
                  return (
                    <article key={image.id} className="group overflow-hidden rounded-lg border border-border bg-muted/20">
                      <div className="aspect-[4/3] overflow-hidden bg-muted"><ImageWithFallback src={image.imagen_url} alt={`${selectedService.nombre}, imagen adicional ${index + 1}`} className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /></div>
                      <div className="flex items-center justify-between gap-2 p-2"><span className="text-xs text-muted-foreground">Imagen {index + 1}</span><Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive" disabled={isDeleting} onClick={() => void removeImage(image.id)} aria-label={`Eliminar imagen ${index + 1} de ${selectedService.nombre}`}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}<span className="ml-1.5">Eliminar</span></Button></div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
