import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '../../../infrastructure/http/ApiClient'

export interface BeProject {
  id: number
  titulo: string
  descripcion: string
  tag: string
  imagen_url?: string
  activo: boolean
  orden: number
}

export interface ProjectForm {
  titulo: string
  descripcion: string
  tag: string
  imagen_url: string
}

/**
 * DIP seam for GalleryAdminPanel — encapsula las llamadas a la API de proyectos.
 * Mirror de useCatalogAdmin (catálogo) para gestión de la galería.
 */
export function useGalleryAdmin() {
  const [projects, setProjects] = useState<BeProject[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<BeProject[]>('/proyectos/admin/')
      setProjects(data)
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  const buildForm = (form: ProjectForm, imagen?: File | null) => {
    const fd = new FormData()
    fd.append('titulo', form.titulo)
    fd.append('descripcion', form.descripcion)
    fd.append('tag', form.tag)
    if (form.imagen_url) fd.append('imagen_url', form.imagen_url)
    if (imagen) fd.append('imagen', imagen)
    return fd
  }

  const createProject = useCallback(async (form: ProjectForm, imagen?: File | null) => {
    await apiClient.post('/proyectos/admin/', buildForm(form, imagen), { headers: { 'Content-Type': 'multipart/form-data' } })
  }, [])

  const editProject = useCallback(async (id: number, form: ProjectForm, imagen?: File | null) => {
    await apiClient.patch(`/proyectos/admin/${id}`, buildForm(form, imagen), { headers: { 'Content-Type': 'multipart/form-data' } })
  }, [])

  const toggleProject = useCallback(async (id: number) => {
    await apiClient.patch(`/proyectos/admin/${id}?action=toggle`)
  }, [])

  useEffect(() => { void load() }, [load])

  return { projects, loading, load, createProject, editProject, toggleProject }
}
