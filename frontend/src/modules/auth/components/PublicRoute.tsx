/**
 * PublicRoute — redirects an authenticated visitor away from guest-only routes.
 *
 * Mirror image of ProtectedRoute: that one keeps guests out of the app, this one
 * keeps sessions out of /login, /register and /forgot-password.
 *
 * SRP: route guarding only.
 * DIP: reads the session from useAuth — never inspects tokens or storage, so the
 *      guard stays correct no matter how AuthProvider persists the session.
 */

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

interface PublicRouteProps {
  children: ReactNode
  /** Where to send an already-authenticated visitor. Must be an internal path. */
  redirectTo?: string
}

export function PublicRoute({ children, redirectTo = '/app' }: Readonly<PublicRouteProps>) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return null
  if (isAuthenticated) return <Navigate to={redirectTo} replace />
  return <>{children}</>
}
