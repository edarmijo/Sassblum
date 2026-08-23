/**
 * IUserAdminActions — FE contract for admin user management (HU-14, ISP).
 * Separate from IAuthService (session) — ISP. SOLID: ISP · DIP.
 */

export interface AdminUser {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  estado: string
  emailVerificado: boolean
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

export interface IUserAdminActions {
  listUsers(filters?: { role?: string; estado?: string }): Promise<AdminUser[]>
  createUser(data: CreateUserData): Promise<AdminUser>
  updateUser(id: string, data: UpdateUserData): Promise<AdminUser>
  blockUser(id: string): Promise<AdminUser>
  unblockUser(id: string): Promise<AdminUser>
}
