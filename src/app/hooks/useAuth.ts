import { useAppSelector } from '@/app/redux-hooks'

export function useAuth() {
  const { user, token, status } = useAppSelector((state) => state.auth)
  return { user, token, status, isAuthenticated: Boolean(user && token) }
}
