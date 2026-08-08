import type { ReactNode } from 'react'
import { ImagePlus, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminEntityPanel } from '../../../core/hooks/useAdminEntityPanel'
import { AdminFormActions, AdminFormCard, AdminImagePicker, AdminEntityLayout } from '../../../core/ui/AdminEntityFormControls'
import { Input } from '../../../core/ui/input'
import { Label } from '../../../core/ui/label'
import { useClientLogoAdmin } from '../hooks/useClientLogo'
import type { ClientLogo, ClientLogoPayload } from '../interfaces/IClientLogoService'
import { ClientLogoCard } from './ClientLogoCard'

const EMPTY_FORM: ClientLogoPayload = {
  nombre: '',
  logoUrl: '',
  activo: true,
  orden: 0,
}

export function ClientLogosAdminPanel() {
  const { clientLogos, loading, load, createClientLogo, updateClientLogo, deleteClientLogo } = useClientLogoAdmin()
  const {
    submitting, form, setForm, imagen, setImagen, editingId, isEditing, resetForm, startEdit, handleSubmit,
  } = useAdminEntityPanel<ClientLogoPayload, ClientLogo>({
    emptyForm: EMPTY_FORM,
    formFromEntity: (logo) => ({ nombre: logo.nombre, logoUrl: logo.logoUrl, activo: logo.activo, orden: logo.orden }),
    createFn: async (data, logo) => {
      await createClientLogo(data, logo)
    },
    editFn: async (id, data, logo) => {
      await updateClientLogo(id, data, logo)
    },
    toggleFn: async (id) => {
      const target = clientLogos.find((logo) => logo.id === id)
      if (!target) return
      await updateClientLogo(id, { ...target, activo: !target.activo })
    },
    loadFn: load,
    validate: (data) => !data.nombre.trim() ? 'El nombre del cliente es obligatorio' : null,
    entityLabel: 'logo',
    descriptionFn: (data) => data.nombre,
  })

  const handleDelete = async (logo: ClientLogo) => {
    if (!window.confirm(`¿Eliminar el logo de ${logo.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await deleteClientLogo(logo.id)
      if (editingId === logo.id) resetForm()
      await load()
      toast.success('Logo eliminado', { description: logo.nombre })
    } catch {
      toast.error('No se pudo eliminar el logo')
    }
  }

  const submitContent = isEditing ? (
    <><Pencil className="mr-2 h-4 w-4" />Actualizar logo</>
  ) : (
    <><Plus className="mr-2 h-4 w-4" />Agregar logo</>
  )

  let listArea: ReactNode
  if (loading) {
    listArea = <p className="text-sm text-muted-foreground">Cargando logos de clientes…</p>
  } else if (clientLogos.length === 0) {
    listArea = (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <ImagePlus className="mx-auto mb-3 h-7 w-7 text-brand-cyan" />
        <p className="font-medium text-foreground">Aún no hay logos cargados.</p>
        <p className="mt-1 text-sm text-muted-foreground">Agrega el primer cliente para mostrarlo en el carrusel.</p>
      </div>
    )
  } else {
    listArea = (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {clientLogos.map((logo) => (
          <ClientLogoCard
            key={logo.id}
            logo={logo}
            isSelected={editingId === logo.id}
            onEdit={() => startEdit(logo)}
            onToggle={() => void (async () => {
              await updateClientLogo(logo.id, { ...logo, activo: !logo.activo })
              await load()
            })().catch(() => toast.error('No se pudo cambiar la visibilidad del logo'))}
            onDelete={() => void handleDelete(logo)}
          />
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-foreground">Logos de clientes</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Administra los logos y el orden con que aparecerán en el carrusel público.</p>
      </header>
      <AdminEntityLayout
        formCard={
          <AdminFormCard
            isEditing={isEditing}
            editTitle="Editar logo"
            createTitle="Nuevo logo de cliente"
            editDescription="Actualiza identidad visual, orden o visibilidad"
            createDescription="Carga una imagen transparente o indica su URL"
            onCancel={resetForm}
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <Label htmlFor="client-logo-name">Cliente</Label>
              <Input id="client-logo-name" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Ej. Policentro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-logo-order">Posición en el carrusel</Label>
              <Input id="client-logo-order" type="number" min="0" value={form.orden} onChange={(event) => setForm((current) => ({ ...current, orden: Number(event.target.value) || 0 }))} />
            </div>
            <AdminImagePicker
              idPrefix="client-logo"
              urlValue={form.logoUrl}
              onUrlChange={(value) => setForm((current) => ({ ...current, logoUrl: value }))}
              fileLabel="…o sube el archivo del logo"
              filePlaceholder="Seleccionar logo…"
              fileName={imagen?.name}
              onFileChange={setImagen}
            />
            <AdminFormActions submitting={submitting} submitContent={submitContent} isEditing={isEditing} onCancel={resetForm} />
          </AdminFormCard>
        }
        listArea={listArea}
      />
    </section>
  )
}
