/**
 * CatalogService — concrete ICatalogClientView (+ admin) using ApiClient.
 * SRP: catalog HTTP + shape mapping. DIP: hooks depend on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import { querySuffix } from '../../../core/utils/query'
import type {
  ICatalogClientView,
} from '../interfaces/ICatalogClientView'
import type {
  ServiceSummary,
  ServiceDetail,
  ServiceFilterOptions,
} from '../interfaces/ICatalogService'

interface BackendService {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  activo: boolean
  imagen_url?: string
  creado_en?: string
  actualizado_en?: string
  imagenes?: Array<{ id: number; imagen_url: string; orden: number }>
  descripcion_detalle?: string
}

function mapSummary(s: BackendService): ServiceSummary {
  return {
    id: String(s.id),
    nombre: s.nombre,
    descripcion: s.descripcion,
    categoria: s.categoria,
    activo: s.activo,
    imagenUrl: s.imagen_url ?? '',
    imagenes: (s.imagenes ?? []).map((img) => ({
      id: img.id,
      imagenUrl: img.imagen_url,
      orden: img.orden,
    })),
    descripcionDetalle: s.descripcion_detalle ?? '',
  }
}

function mapDetail(s: BackendService): ServiceDetail {
  return {
    ...mapSummary(s),
    creadoEn: s.creado_en ?? '',
    actualizadoEn: s.actualizado_en ?? '',
  }
}

class CatalogService implements ICatalogClientView {
  async getActiveServices(filters?: ServiceFilterOptions): Promise<ServiceSummary[]> {
    const params = new URLSearchParams()
    if (filters?.categoria) params.set('categoria', filters.categoria)
    if (filters?.busqueda) params.set('busqueda', filters.busqueda)
    const data = await apiClient.get<{ items: BackendService[]; total: number }>(
      `/servicios/${querySuffix(params)}`,
    )
    return data.items.map(mapSummary)
  }

  async getServiceDetail(id: string): Promise<ServiceDetail> {
    const data = await apiClient.get<BackendService>(`/servicios/${id}`)
    return mapDetail(data)
  }
}

export const catalogService = new CatalogService()
