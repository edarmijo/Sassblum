/**
 * ProtectedRoute — redirects to /login when there is no in-memory session.
 * Optionally restricts by role. SRP: route guarding only.
 *
 * Waits for AuthProvider to finish rehydrating the session from the httpOnly
 * cookie before deciding: without this guard the route redirects to /login on
 * every page reload before the async refresh completes (BUG-06 regression).
 */

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../interfaces/IAuthService'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: Readonly<ProtectedRouteProps>) {
  const { user, isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
