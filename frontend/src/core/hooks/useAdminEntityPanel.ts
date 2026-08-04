import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

export interface AdminEntityPanelConfig<TForm, TEntity extends { id: number }> {
  emptyForm: TForm
  formFromEntity: (entity: TEntity) => TForm
  createFn: (form: TForm, file: File | null) => Promise<void>
  editFn: (id: number, form: TForm, file: File | null) => Promise<void>
  toggleFn: (id: number) => Promise<void>
  loadFn: () => Promise<void>
  validate: (form: TForm) => string | null
  entityLabel: string
  descriptionFn: (form: TForm) => string
}

export function useAdminEntityPanel<TForm, TEntity extends { id: number }>(
  config: AdminEntityPanelConfig<TForm, TEntity>
) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<TForm>(config.emptyForm)
  const [imagen, setImagen] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const isEditing = editingId !== null

  const resetForm = () => {
    setForm(config.emptyForm)
    setImagen(null)
    setEditingId(null)
  }

  const startEdit = (entity: TEntity) => {
    setForm(config.formFromEntity(entity))
    setImagen(null)
    setEditingId(entity.id)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const error = config.validate(form)
    if (error) { toast.error(error); return }
    setSubmitting(true)
    const label = config.entityLabel
    const cap = label.charAt(0).toUpperCase() + label.slice(1)
    try {
      if (isEditing && editingId !== null) {
        await config.editFn(editingId, form, imagen)
        toast.success(`${cap} actualizado`, { description: config.descriptionFn(form) })
      } else {
        await config.createFn(form, imagen)
        toast.success(`${cap} creado`, { description: config.descriptionFn(form) })
      }
      resetForm()
      await config.loadFn()
    } catch {
      toast.error(isEditing ? `No se pudo actualizar el ${label}` : `No se pudo crear el ${label}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await config.toggleFn(id)
      await config.loadFn()
    } catch {
      toast.error(`No se pudo cambiar el estado del ${config.entityLabel}`)
    }
  }

  return { submitting, form, setForm, imagen, setImagen, editingId, isEditing, resetForm, startEdit, handleSubmit, handleToggle }
}
