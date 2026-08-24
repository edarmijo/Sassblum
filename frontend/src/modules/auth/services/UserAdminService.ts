/**
 * UserAdminService — concrete IUserAdminActions using ApiClient.
 * SRP: user-admin HTTP + mapping. DIP: hooks depend on the interface.
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import { querySuffix } from '../../../core/utils/query'
import type {
  IUserAdminActions,
  AdminUser,
  AdminUserOperationResult,
  CreateUserData,
  MailboxManagement,
  MailboxStatus,
  RotateOccupantData,
  RotateOccupantManualData,
  UpdateUserData,
} from '../interfaces/IUserAdminActions'

interface BeUser {
  id: number
  email: string
  nombre: string
  apellido: string
  rol: string
  estado: string
  email_verificado: boolean
  buzon_estado?: MailboxStatus
  buzon_gestion?: MailboxManagement
  app_password?: string
  buzon_password?: string
}

function mapUser(u: BeUser): AdminUserOperationResult {
  return {
    id: String(u.id),
    email: u.email,
    nombre: u.nombre,
    apellido: u.apellido,
    rol: u.rol,
    estado: u.estado,
    emailVerificado: u.email_verificado,
    buzonEstado: u.buzon_estado ?? 'no_aplica',
    buzonGestion: u.buzon_gestion ?? 'no_aplica',
    ...(u.app_password ? { appPassword: u.app_password } : {}),
    ...(u.buzon_password ? { buzonPassword: u.buzon_password } : {}),
  }
}

class UserAdminService implements IUserAdminActions {
  async listUsers(filters?: { role?: string; estado?: string }): Promise<AdminUser[]> {
    const params = new URLSearchParams()
    if (filters?.role) params.set('role', filters.role)
    if (filters?.estado) params.set('estado', filters.estado)
    const data = await apiClient.get<{ items: BeUser[] }>(`/usuarios/${querySuffix(params)}`)
    return data.items.map(mapUser)
  }

  async createUser(data: CreateUserData): Promise<AdminUserOperationResult> {
    return mapUser(await apiClient.post<BeUser>('/usuarios/', data))
  }

  async updateUser(id: string, data: UpdateUserData): Promise<AdminUser> {
    return mapUser(await apiClient.patch<BeUser>(`/usuarios/${id}`, data))
  }

  async blockUser(id: string): Promise<AdminUser> {
    return mapUser(await apiClient.patch<BeUser>(`/usuarios/${id}/bloquear`))
  }

  async unblockUser(id: string): Promise<AdminUser> {
    return mapUser(await apiClient.patch<BeUser>(`/usuarios/${id}/desbloquear`))
  }

  async retryMailbox(id: string): Promise<AdminUserOperationResult> {
    return mapUser(
      await apiClient.post<BeUser>(`/usuarios/${id}/buzon/reintentar`, {}),
    )
  }

  async rotateOccupant(
    id: string,
    data: RotateOccupantData,
  ): Promise<AdminUserOperationResult> {
    return mapUser(
      await apiClient.post<BeUser>(`/usuarios/${id}/rotar-ocupante`, data),
    )
  }

  async rotateOccupantManually(
    id: string,
    data: RotateOccupantManualData,
  ): Promise<AdminUserOperationResult> {
    return mapUser(
      await apiClient.post<BeUser>(`/usuarios/${id}/rotar-ocupante-manual`, {
        nombre: data.nombre,
        apellido: data.apellido,
        email_confirmacion: data.emailConfirmacion,
        rotacion_buzon_confirmada: data.rotacionBuzonConfirmada,
      }),
    )
  }
}

export const userAdminService = new UserAdminService()
