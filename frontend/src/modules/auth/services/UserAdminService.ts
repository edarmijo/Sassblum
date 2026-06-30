/**
 * UserAdminService — concrete IUserAdminActions using ApiClient.
 * SRP: user-admin HTTP + mapping. DIP: hooks depend on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type {
  IUserAdminActions,
  AdminUser,
  CreateUserData,
} from '../interfaces/IUserAdminActions'

interface BeUser {
  id: number
  email: string
  nombre: string
  apellido: string
  rol: string
  estado: string
  email_verificado: boolean
}

function mapUser(u: BeUser): AdminUser {
  return {
    id: String(u.id),
    email: u.email,
    nombre: u.nombre,
    apellido: u.apellido,
    rol: u.rol,
    estado: u.estado,
    emailVerificado: u.email_verificado,
  }
}

class UserAdminService implements IUserAdminActions {
  async listUsers(filters?: { role?: string; estado?: string }): Promise<AdminUser[]> {
    const params = new URLSearchParams()
    if (filters?.role) params.set('role', filters.role)
    if (filters?.estado) params.set('estado', filters.estado)
    const qs = params.toString()
    const data = await apiClient.get<{ items: BeUser[] }>(`/usuarios/${qs ? `?${qs}` : ''}`)
    return data.items.map(mapUser)
  }

  async createUser(data: CreateUserData): Promise<AdminUser> {
    return mapUser(await apiClient.post<BeUser>('/usuarios/', data))
  }

  async blockUser(id: string): Promise<AdminUser> {
    return mapUser(await apiClient.patch<BeUser>(`/usuarios/${id}/bloquear`))
  }

  async unblockUser(id: string): Promise<AdminUser> {
    return mapUser(await apiClient.patch<BeUser>(`/usuarios/${id}/desbloquear`))
  }
}

export const userAdminService = new UserAdminService()
