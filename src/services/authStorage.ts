/**
 * Persists Recovery auth tokens so a full page reload keeps the session.
 * Uses localStorage (SPA-friendly; Bearer tokens are sent from memory/Redux at runtime).
 * For httpOnly cookie–based auth, the API would need to set cookies on login — not duplicated here.
 */
const STORAGE_KEY = 'recovery_platform_auth_v1'

export type PersistedAuthPayload = {
  accessToken: string
  refreshToken: string
}

export function loadPersistedSession(): PersistedAuthPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as PersistedAuthPayload).accessToken !== 'string' ||
      typeof (parsed as PersistedAuthPayload).refreshToken !== 'string'
    ) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    const { accessToken, refreshToken } = parsed as PersistedAuthPayload
    if (!accessToken.trim() || !refreshToken.trim()) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { accessToken, refreshToken }
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    return null
  }
}

/** Sync Redux auth tokens to storage whenever they change. */
export function persistAuthState(token: string | null, refreshToken: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (token && refreshToken) {
      const payload: PersistedAuthPayload = { accessToken: token, refreshToken }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedSession(): void {
  persistAuthState(null, null)
}
