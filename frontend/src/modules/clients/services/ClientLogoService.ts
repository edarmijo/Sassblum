import { apiClient } from '../../../infrastructure/http/ApiClient'
import type { ClientLogo, ClientLogoPayload, IClientLogoService } from '../interfaces/IClientLogoService'

interface BackendClientLogo {
  id: number
  nombre?: string
  name?: string
  logo_url?: string
  imagen_url?: string
  activo?: boolean
  orden?: number
}

type BackendClientLogoList = BackendClientLogo[] | { items: BackendClientLogo[] }

function mapClientLogo(logo: BackendClientLogo): ClientLogo {
  return {
    id: logo.id,
    nombre: logo.nombre ?? logo.name ?? '',
    logoUrl: logo.logo_url ?? logo.imagen_url ?? '',
    activo: logo.activo ?? true,
    orden: logo.orden ?? 0,
  }
}

function toFormData(data: ClientLogoPayload, logo?: File | null): FormData {
  const formData = new FormData()
  formData.append('nombre', data.nombre)
  formData.append('activo', String(data.activo))
  formData.append('orden', String(data.orden))
  if (data.logoUrl) formData.append('logo_url', data.logoUrl)
  if (logo) formData.append('logo', logo)
  return formData
}

function mapList(data: BackendClientLogoList): ClientLogo[] {
  const items = Array.isArray(data) ? data : data.items
  return items.map(mapClientLogo).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
}

/** Implementación HTTP del contrato de logos; las credenciales se gestionan en ApiClient. */
class ClientLogoService implements IClientLogoService {
  async getPublicClientLogos(): Promise<ClientLogo[]> {
    return mapList(await apiClient.get<BackendClientLogoList>('/clientes/'))
  }

  async getAdminClientLogos(): Promise<ClientLogo[]> {
    return mapList(await apiClient.get<BackendClientLogoList>('/clientes/admin/'))
  }

  async createClientLogo(data: ClientLogoPayload, logo?: File | null): Promise<ClientLogo> {
    const created = await apiClient.post<BackendClientLogo>('/clientes/admin/', toFormData(data, logo), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapClientLogo(created)
  }

  async updateClientLogo(id: number, data: ClientLogoPayload, logo?: File | null): Promise<ClientLogo> {
    const updated = await apiClient.patch<BackendClientLogo>(`/clientes/admin/${id}/`, toFormData(data, logo), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapClientLogo(updated)
  }

  async deleteClientLogo(id: number): Promise<void> {
    await apiClient.delete(`/clientes/admin/${id}/`)
  }
}

export const clientLogoService = new ClientLogoService()
