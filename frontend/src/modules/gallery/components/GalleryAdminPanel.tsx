import { useState } from 'react'
import type { ReactNode } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useGalleryAdmin, type BeProject } from '../hooks/useGalleryAdmin'
import { useAdminEntityPanel } from '../../../core/hooks/useAdminEntityPanel'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { Textarea } from '../../../core/ui/textarea'
import { AdminEntityCard } from '../../../core/ui/AdminEntityCard'
import { AdminImagePicker, AdminFormActions, AdminFormCard, AdminEntityLayout } from '../../../core/ui/AdminEntityFormControls'

const EMPTY_FORM = { titulo: '', descripcion: '', tag: '', imagen_url: '' }

export function GalleryAdminPanel() {
  const { projects, loading, load, createProject, editProject, toggleProject, deleteProject } = useGalleryAdmin()
  const [actionProjectId, setActionProjectId] = useState<number | null>(null)

  const { submitting, form, setForm, imagen, setImagen, editingId, isEditing, resetForm, startEdit, handleSubmit } =
    useAdminEntityPanel<typeof EMPTY_FORM, BeProject>({
      emptyForm: EMPTY_FORM,
      formFromEntity: (p) => ({ titulo: p.titulo, descripcion: p.descripcion, tag: p.tag, imagen_url: p.imagen_url ?? '' }),
      createFn: (f, img) => createProject(f, img),
      editFn: (id, f, img) => editProject(id, f, img),
      toggleFn: toggleProject,
      loadFn: load,
      validate: (f) => !f.titulo ? 'El título es obligatorio' : null,
      entityLabel: 'proyecto',
      descriptionFn: (f) => f.titulo,
    })

  const submitContent = isEditing
    ? <><Pencil className="h-4 w-4 mr-2" />Actualizar</>
    : <><Plus className="h-4 w-4 mr-2" />Crear proyecto</>

  const handleProjectToggle = async (project: BeProject) => {
    setActionProjectId(project.id)
    try {
      await toggleProject(project.id)
      await load()
      toast.success(project.activo ? 'Proyecto ocultado' : 'Proyecto publicado', { description: project.titulo })
    } catch {
      toast.error('No se pudo cambiar la visibilidad del proyecto')
    } finally {
      setActionProjectId(null)
    }
  }

  const handleProjectDelete = async (project: BeProject) => {
    if (!window.confirm(`¿Eliminar el proyecto "${project.titulo}"? Esta acción no se puede deshacer.`)) return

    setActionProjectId(project.id)
    try {
      await deleteProject(project.id)
      if (editingId === project.id) resetForm()
      await load()
      toast.success('Proyecto eliminado', { description: project.titulo })
    } catch {
      toast.error('No se pudo eliminar el proyecto')
    } finally {
      setActionProjectId(null)
    }
  }

  let projectsList: ReactNode
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
            actionPending={actionProjectId !== null}
            onEdit={() => startEdit(p)}
            onToggle={() => void handleProjectToggle(p)}
            onDelete={() => void handleProjectDelete(p)}
          />
        ))}
      </div>
    )
  }

  return (
    <AdminEntityLayout
      formCard={
        <AdminFormCard
          isEditing={isEditing}
          editTitle="Editar proyecto"
          createTitle="Nuevo proyecto"
          editDescription="Modifica los datos del proyecto"
          createDescription="Publica un proyecto en la galería"
          onCancel={resetForm}
          onSubmit={handleSubmit}
        >
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
        </AdminFormCard>
      }
      listArea={projectsList}
    />
  )
}
