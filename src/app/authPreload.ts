import { authInitialState } from '@/app/features/auth/authSlice'
import { userFromAccessToken } from '@/lib/jwt'
import { clearPersistedSession, loadPersistedSession } from '@/services/authStorage'

export function buildAuthPreload() {
  const persisted = loadPersistedSession()
  if (!persisted) return undefined
  const user = userFromAccessToken(persisted.accessToken)
  if (!user) {
    clearPersistedSession()
    return undefined
  }
  return {
    ...authInitialState,
    token: persisted.accessToken,
    refreshToken: persisted.refreshToken,
    user,
  }
}
