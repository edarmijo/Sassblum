/**
 * ProtectedRoute — redirects to /login when there is no in-memory session.
 * Optionally restricts by role. SRP: route guarding only.
 */

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../interfaces/IAuthService'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
