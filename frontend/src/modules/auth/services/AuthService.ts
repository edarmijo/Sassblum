/**
 * AuthService — concrete IAuthService using ApiClient.
 *
 * SRP: auth HTTP operations + BE↔FE shape mapping. DIP: components depend on
 * IAuthService, never on this class. Pattern: Singleton (exported instance).
 */

import { apiClient } from '../../../infrastructure/http/ApiClient'
import type {
  IAuthService,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  AuthUser,
  UserRole,
  UserStatus,
  ProfileUpdateData,
  IdentificationType,
  ChangePasswordData,
} from '../interfaces/IAuthService'

const ROLE_MAP: Record<string, UserRole> = {
  client: 'CLIENTE',
  worker: 'TRABAJADOR',
  admin: 'ADMINISTRADOR',
}
const STATUS_MAP: Record<string, UserStatus> = {
  activo: 'ACTIVO',
  bloqueado: 'BLOQUEADO',
  pendiente: 'PENDIENTE',
}

interface BackendUser {
  id: number
  email: string
  nombre: string
  apellido: string
  tipo_identificacion?: IdentificationType
  ruc?: string
  empresa?: string
  rol: string
  estado: string
  email_verificado: boolean
}

function mapUser(u: BackendUser): AuthUser {
  return {
    id: String(u.id),
    email: u.email,
    nombre: u.nombre,
    apellido: u.apellido,
    tipoIdentificacion: u.tipo_identificacion ?? 'RUC',
    ruc: u.ruc ?? '',
    empresa: u.empresa ?? '',
    rol: ROLE_MAP[u.rol] ?? 'CLIENTE',
    estado: STATUS_MAP[u.estado] ?? 'PENDIENTE',
    emailVerificado: u.email_verificado,
  }
}

function mapTokens(t: { access: string }): AuthTokens {
  return { accessToken: t.access }
}

class AuthService implements IAuthService {
  async login(credentials: LoginCredentials) {
    const data = await apiClient.post<{ user: BackendUser; tokens: { access: string } }>(
      '/auth/login',
      credentials,
    )
    return { user: mapUser(data.user), tokens: mapTokens(data.tokens) }
  }

  async register(data: RegisterData) {
    return apiClient.post<{ message: string }>('/auth/register', {
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      tipo_identificacion: data.tipoIdentificacion,
      ruc: data.ruc,
      empresa: data.empresa,
      password: data.password,
      confirm_password: data.confirmPassword,
    })
  }

  async logout() {
    await apiClient.post('/auth/logout', {})
  }

  async forgotPassword(email: string) {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    })
  }

  async changePassword(data: ChangePasswordData) {
    return apiClient.post<{ message: string }>('/auth/cambiar-password', {
      current_password: data.currentPassword,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    })
  }

  async verifyEmail(token: string) {
    return apiClient.post<{ message: string }>('/auth/verify-email', { token })
  }

  async updateProfile(data: ProfileUpdateData): Promise<AuthUser> {
    const u = await apiClient.patch<BackendUser>('/auth/perfil', data)
    return mapUser(u)
  }

  async refreshSession(): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Sin body: el refresh token lo adjunta el navegador vía cookie httpOnly.
    const data = await apiClient.post<{
      access: string
      user: BackendUser
    }>('/auth/token/refresh', {})
    return {
      user: mapUser(data.user),
      tokens: { accessToken: data.access },
    }
  }
}

export const authService = new AuthService()
