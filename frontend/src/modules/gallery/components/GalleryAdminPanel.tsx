import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, ImagePlus, Loader2, X, Power } from 'lucide-react'
import { useGalleryAdmin, type BeProject, type ProjectForm } from '../hooks/useGalleryAdmin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { Badge } from '../../../core/ui/badge'
import { ImageWithFallback } from '../../../core/ui/ImageWithFallback'

const EMPTY: ProjectForm = { titulo: '', descripcion: '', tag: '', imagen_url: '' }

/**
 * Gestión de la galería de proyectos para admin/trabajador (crear + editar + activar).
 * Mirror de CatalogAdminPanel — para que el admin agregue cards sin tocar código.
 * DIP: depende de useGalleryAdmin (no de apiClient directamente).
 */
export function GalleryAdminPanel() {
  const { projects, loading, load, createProject, editProject, toggleProject } = useGalleryAdmin()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<ProjectForm>(EMPTY)
  const [imagen, setImagen] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const isEditing = editingId !== null

  const resetForm = () => {
    setForm(EMPTY)
    setImagen(null)
    setEditingId(null)
  }

  const startEdit = (p: BeProject) => {
    setForm({ titulo: p.titulo, descripcion: p.descripcion, tag: p.tag, imagen_url: p.imagen_url ?? '' })
    setImagen(null)
    setEditingId(p.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo) {
      toast.error('El título es obligatorio')
      return
    }
    setSubmitting(true)
    try {
      if (isEditing) {
        await editProject(editingId as number, form, imagen)
        toast.success('Proyecto actualizado', { description: form.titulo })
      } else {
        await createProject(form, imagen)
        toast.success('Proyecto creado', { description: form.titulo })
      }
      resetForm()
      await load()
    } catch {
      toast.error(editingId ? 'No se pudo actualizar el proyecto' : 'No se pudo crear el proyecto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await toggleProject(id)
      await load()
    } catch {
      toast.error('No se pudo cambiar el estado del proyecto')
    }
  }

  const submitContent = isEditing
    ? <><Pencil className="h-4 w-4 mr-2" />Actualizar</>
    : <><Plus className="h-4 w-4 mr-2" />Crear proyecto</>

  let projectsList: React.ReactNode
  if (loading) {
    projectsList = <p className="text-gray-500">Cargando galería…</p>
  } else if (projects.length === 0) {
    projectsList = <p className="text-gray-500">Aún no hay proyectos.</p>
  } else {
    projectsList = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((p) => (
          <Card key={p.id} className={`overflow-hidden transition-opacity ${editingId === p.id ? 'ring-2 ring-brand-cyan' : ''}`}>
            <div className="h-32 overflow-hidden bg-brand-navy/5">
              <ImageWithFallback src={p.imagen_url} alt={p.titulo} className="w-full h-full object-cover" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{p.titulo}</CardTitle>
                <Badge className={p.activo ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <CardDescription className="line-clamp-2">{p.descripcion}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-brand-cyan">{p.tag}</span>
                <div className="flex gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => startEdit(p)} aria-label={`Editar ${p.titulo}`}>
                    <Pencil className="h-3 w-3 mr-1" />Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2 text-xs ${p.activo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                    onClick={() => void handleToggle(p.id)}
                    aria-label={p.activo ? `Desactivar ${p.titulo}` : `Activar ${p.titulo}`}
                  >
                    <Power className="h-3 w-3 mr-1" />{p.activo ? 'Off' : 'On'}
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
              <CardTitle>{isEditing ? 'Editar proyecto' : 'Nuevo proyecto'}</CardTitle>
              <CardDescription>
                {isEditing ? 'Modifica los datos del proyecto' : 'Publica un proyecto en la galería'}
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
              <Label htmlFor="p-titulo">Título</Label>
              <Input id="p-titulo" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-tag">Etiqueta</Label>
              <Input id="p-tag" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} placeholder="Servidores, CCTV, Domótica…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Descripción</Label>
              <Textarea id="p-desc" rows={3} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-url">URL de imagen</Label>
              <Input id="p-url" value={form.imagen_url} onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-img">…o sube una imagen</Label>
              <label htmlFor="p-img" className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-brand-cyan">
                <ImagePlus className="h-4 w-4 text-brand-cyan" />
                {imagen ? imagen.name : 'Seleccionar imagen…'}
              </label>
              <input id="p-img" type="file" accept="image/*" className="hidden" onChange={(e) => setImagen(e.target.files?.[0] ?? null)} />
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
        {projectsList}
      </div>
    </div>
  )
}
