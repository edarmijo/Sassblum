import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, X } from 'lucide-react'
import { useGalleryAdmin, type BeProject, type ProjectForm } from '../hooks/useGalleryAdmin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../core/ui/card'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { AdminEntityCard } from '../../../core/ui/AdminEntityCard'
import { AdminImagePicker, AdminFormActions } from '../../../core/ui/AdminEntityFormControls'

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
          <AdminEntityCard
            key={p.id}
            titulo={p.titulo}
            descripcion={p.descripcion}
            etiqueta={p.tag}
            imagenUrl={p.imagen_url}
            activo={p.activo}
            resaltada={editingId === p.id}
            onEdit={() => startEdit(p)}
            onToggle={() => void handleToggle(p.id)}
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
            <AdminImagePicker
              idPrefix="p"
              urlValue={form.imagen_url}
              onUrlChange={(v) => setForm((f) => ({ ...f, imagen_url: v }))}
              fileLabel="…o sube una imagen"
              filePlaceholder="Seleccionar imagen…"
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
        {projectsList}
      </div>
    </div>
  )
}
