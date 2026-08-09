import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '../../../infrastructure/http/ApiClient'

export interface BeServiceImage {
  id: number
  imagen_url: string
  orden: number
}

export interface BeService {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  activo: boolean
  imagen_url?: string
  imagenes?: BeServiceImage[]
  descripcion_detalle?: string
}

type ServiceForm = Pick<BeService, 'nombre' | 'descripcion' | 'categoria' | 'imagen_url' | 'descripcion_detalle'>

function toServiceFormData(form: ServiceForm, imagen?: File | null): FormData {
  const formData = new FormData()
  formData.append('nombre', form.nombre)
  formData.append('descripcion', form.descripcion)
  formData.append('categoria', form.categoria)
  if (form.imagen_url) formData.append('imagen_url', form.imagen_url)
  if (form.descripcion_detalle !== undefined) formData.append('descripcion_detalle', form.descripcion_detalle)
  if (imagen) formData.append('imagen', imagen)
  return formData
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

  const createService = useCallback(
    async (
      form: ServiceForm,
      imagen?: File | null,
    ) => {
      await apiClient.post('/servicios/admin/', toServiceFormData(form, imagen), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    [],
  )

  const editService = useCallback(
    async (
      id: number,
      form: ServiceForm,
      imagen?: File | null,
    ) => {
      await apiClient.patch(`/servicios/admin/${id}/`, toServiceFormData(form, imagen), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    [],
  )

  const toggleService = useCallback(async (id: number) => {
    await apiClient.patch(`/servicios/admin/${id}/?action=toggle`)
  }, [])

  const deleteService = useCallback(async (id: number) => {
    await apiClient.delete(`/servicios/admin/${id}/`)
  }, [])

  const addServiceImage = useCallback(async (serviceId: number, file: File) => {
    const fd = new FormData()
    fd.append('imagen', file)
    const result = await apiClient.post<BeServiceImage>(
      `/servicios/admin/${serviceId}/imagenes/`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return result
  }, [])

  const deleteServiceImage = useCallback(async (imageId: number) => {
    await apiClient.delete(`/servicios/admin/imagenes/${imageId}/`)
  }, [])

  useEffect(() => {
    load().catch(console.error)
  }, [load])

  return {
    services,
    loading,
    load,
    createService,
    editService,
    toggleService,
    deleteService,
    addServiceImage,
    deleteServiceImage,
  }
}
