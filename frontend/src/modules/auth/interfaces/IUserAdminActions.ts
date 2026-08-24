/**
 * IUserAdminActions — FE contract for admin user management (HU-14, ISP).
 * Separate from IAuthService (session) — ISP. SOLID: ISP · DIP.
 */

export type MailboxStatus = 'creado' | 'pendiente' | 'no_aplica'
export type MailboxManagement = 'manual' | 'uapi' | 'no_aplica'

export interface AdminUser {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  estado: string
  emailVerificado: boolean
  buzonEstado: MailboxStatus
  buzonGestion: MailboxManagement
}

export interface AdminUserOperationResult extends AdminUser {
  appPassword?: string
  buzonPassword?: string
}

export interface CreateUserData {
  nombre: string
  apellido: string
  email: string
  password: string
  role: 'worker' | 'client'
}

export interface UpdateUserData {
  nombre?: string
  apellido?: string
}

export interface RotateOccupantData {
  nombre: string
  apellido: string
}

export interface RotateOccupantManualData extends RotateOccupantData {
  emailConfirmacion: string
  rotacionBuzonConfirmada: boolean
}

export interface IUserAdminActions {
  listUsers(filters?: { role?: string; estado?: string }): Promise<AdminUser[]>
  createUser(data: CreateUserData): Promise<AdminUserOperationResult>
  updateUser(id: string, data: UpdateUserData): Promise<AdminUser>
  blockUser(id: string): Promise<AdminUser>
  unblockUser(id: string): Promise<AdminUser>
  retryMailbox(id: string): Promise<AdminUserOperationResult>
  rotateOccupant(
    id: string,
    data: RotateOccupantData,
  ): Promise<AdminUserOperationResult>
  rotateOccupantManually(
    id: string,
    data: RotateOccupantManualData,
  ): Promise<AdminUserOperationResult>
}
