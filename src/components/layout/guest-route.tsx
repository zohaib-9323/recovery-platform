import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/app/hooks/useAuth'

/**
 * Public (auth) routes: if the user already has a valid session, send them to the app
 * instead of login / forgot-password / reset-password.
 */
export function GuestRoute() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
