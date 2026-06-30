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
  ruc?: string
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
    ruc: u.ruc ?? '',
    rol: ROLE_MAP[u.rol] ?? 'CLIENTE',
    estado: STATUS_MAP[u.estado] ?? 'PENDIENTE',
    emailVerificado: u.email_verificado,
  }
}

function mapTokens(t: { access: string; refresh: string }): AuthTokens {
  return { accessToken: t.access, refreshToken: t.refresh }
}

class AuthService implements IAuthService {
  async login(credentials: LoginCredentials) {
    const data = await apiClient.post<{ user: BackendUser; tokens: { access: string; refresh: string } }>(
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
      ruc: data.ruc ?? '',
      password: data.password,
      confirm_password: data.confirmPassword,
    })
  }

  async logout(refreshToken: string) {
    await apiClient.post('/auth/logout', { refresh: refreshToken })
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

  async verifyEmail(token: string) {
    return apiClient.post<{ message: string }>('/auth/verify-email', { token })
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const data = await apiClient.post<{ access: string; refresh?: string }>(
      '/auth/token/refresh',
      { refresh: refreshToken },
    )
    return { accessToken: data.access, refreshToken: data.refresh ?? refreshToken }
  }
}

export const authService = new AuthService()
