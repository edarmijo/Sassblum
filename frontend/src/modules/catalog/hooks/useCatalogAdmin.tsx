import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '../../../infrastructure/http/ApiClient'

export interface BeService {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  activo: boolean
  imagen_url?: string
}

/**
 * DIP seam for CatalogAdminPanel — encapsulates all API calls.
 * Components depend on this hook's return type, not on apiClient directly.
 * Makes CatalogAdminPanel testable (mock the hook, not axios).
 */
export function useCatalogAdmin() {
  const [services, setServices] = useState<BeService[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<BeService[]>('/servicios/admin/')
      setServices(data)
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createService = useCallback(async (form: { nombre: string; descripcion: string; categoria: string; imagen_url?: string }, imagen?: File | null) => {
    const fd = new FormData()
    fd.append('nombre', form.nombre)
    fd.append('descripcion', form.descripcion)
    fd.append('categoria', form.categoria)
    if (form.imagen_url) fd.append('imagen_url', form.imagen_url)
    if (imagen) fd.append('imagen', imagen)
    await apiClient.post('/servicios/admin/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  }, [])

  const editService = useCallback(async (id: number, form: { nombre: string; descripcion: string; categoria: string; imagen_url?: string }, imagen?: File | null) => {
    const fd = new FormData()
    fd.append('nombre', form.nombre)
    fd.append('descripcion', form.descripcion)
    fd.append('categoria', form.categoria)
    if (form.imagen_url) fd.append('imagen_url', form.imagen_url)
    if (imagen) fd.append('imagen', imagen)
    await apiClient.patch(`/servicios/admin/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  }, [])

  const toggleService = useCallback(async (id: number) => {
    await apiClient.patch(`/servicios/admin/${id}?action=toggle`)
  }, [])

  useEffect(() => { load().catch(console.error) }, [load])

  return { services, loading, load, createService, editService, toggleService }
}
