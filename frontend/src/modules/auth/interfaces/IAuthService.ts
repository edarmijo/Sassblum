/**
 * Root contract for all authentication operations in the frontend.
 * Every component, hook, and page that needs auth depends on THIS interface,
 * never on the concrete AuthService class (DIP).
 *
 * Responsibility (SRP): declare the auth operation contract. No HTTP logic here.
 * Depends on: nothing — this is the abstraction root for the auth module.
 * Pattern: DIP anchor · Singleton target (AuthService will implement this)
 * SOLID: DIP · OCP · LSP (AuthService is fully replaceable in tests without touching views)
 *
 * Sprint coverage:
 *   S1  → this file (contracts only)
 *   S6  → AuthService implements IAuthService
 *   S6  → useAuth hook exposes IAuthService methods to components
 */

// ─── Input types ─────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  nombre: string
  apellido: string
  email: string
  empresa?: string
  ruc?: string
  password: string
  confirmPassword: string
}

// ─── Output / domain types ────────────────────────────────────────────────────

export interface AuthTokens {
  /**
   * Short-lived JWT (1 h). Lives ONLY in memory via useAuth Context.
   * NEVER stored in localStorage or sessionStorage (XSS risk).
   */
  accessToken: string
  /** Long-lived JWT (7 d). Used by ApiClient interceptor to refresh accessToken. */
  refreshToken: string
}

export type UserRole = 'CLIENTE' | 'TRABAJADOR' | 'ADMINISTRADOR'
export type UserStatus = 'ACTIVO' | 'BLOQUEADO' | 'PENDIENTE'

export interface AuthUser {
  id: string
  email: string
  nombre: string
  apellido: string
  ruc: string
  empresa: string
  rol: UserRole
  estado: UserStatus
  emailVerificado: boolean
}

// ─── Service contract ─────────────────────────────────────────────────────────

export interface IAuthService {
  /**
   * HU-01: Authenticate user and return tokens + profile.
   * Throws: InvalidCredentials | AccountLocked | EmailNotVerified
   */
  login(credentials: LoginCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }>

  /**
   * HU-02: Register a new CLIENTE account (status = PENDIENTE until email verified).
   * Triggers the verification email via backend.
   * Throws: EmailAlreadyExists | PasswordPolicyViolation
   */
  register(data: RegisterData): Promise<{ message: string }>

  /**
   * Invalidate the session by adding the refresh token to the backend blacklist.
   * Throws: InvalidToken | TokenAlreadyBlacklisted
   */
  logout(refreshToken: string): Promise<void>

  /**
   * HU-03 step 1: Request a password-reset email.
   * Does NOT reveal whether the email is registered (security: no user enumeration).
   * Throws: RateLimitExceeded
   */
  forgotPassword(email: string): Promise<{ message: string }>

  /**
   * HU-03 step 2: Apply the new password using the one-time token from email.
   * Invalidates all active sessions for the user after success.
   * Throws: InvalidToken | TokenExpired | PasswordPolicyViolation
   */
  resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }>

  /**
   * Confirm email address using the token sent after registration.
   * Transitions user status from PENDIENTE → ACTIVO.
   * Throws: InvalidToken | TokenExpired | AlreadyVerified
   */
  verifyEmail(token: string): Promise<{ message: string }>

  /**
   * Exchange a valid refresh token for a new token pair.
   * Called automatically by the ApiClient interceptor on 401 responses.
   * Throws: InvalidToken | TokenExpired
   */
  refreshTokens(refreshToken: string): Promise<AuthTokens>
}
