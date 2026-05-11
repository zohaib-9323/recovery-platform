import { Navigate } from 'react-router-dom'

import { useAuth } from '@/app/hooks/useAuth'

/** `/` → `/login` when logged out, `/dashboard` when logged in. */
export function RootRedirect() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/login" replace />
}
