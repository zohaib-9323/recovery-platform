import { getJwtExpSeconds } from '@/lib/jwt'
import { reportRuntimeError } from '@/lib/error-reporting'

const SESSION_STORAGE_KEY = 'recovery_platform_auth_v2'
const LEGACY_LOCAL_STORAGE_KEY = 'recovery_platform_auth_v1'
const MAX_PERSIST_MS = 12 * 60 * 60 * 1000

export type PersistedAuthPayload = {
  accessToken: string
  refreshToken: string
}

type PersistedEnvelope = PersistedAuthPayload & {
  expiresAtMs: number
}

type SafeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getStorage(): SafeStorage | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function removeKeys(storage: SafeStorage | null): void {
  if (!storage || typeof window === 'undefined') return
  storage.removeItem(SESSION_STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY)
}

function isValidPayload(value: unknown): value is PersistedAuthPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PersistedAuthPayload).accessToken === 'string' &&
    typeof (value as PersistedAuthPayload).refreshToken === 'string' &&
    Boolean((value as PersistedAuthPayload).accessToken.trim()) &&
    Boolean((value as PersistedAuthPayload).refreshToken.trim())
  )
}

function toExpiresAtMs(accessToken: string, nowMs: number): number {
  const expSeconds = getJwtExpSeconds(accessToken)
  if (expSeconds === null) return nowMs + MAX_PERSIST_MS
  return Math.min(nowMs + MAX_PERSIST_MS, expSeconds * 1000)
}

function writeEnvelope(storage: SafeStorage, payload: PersistedAuthPayload): void {
  const nowMs = Date.now()
  const envelope: PersistedEnvelope = {
    ...payload,
    expiresAtMs: toExpiresAtMs(payload.accessToken, nowMs),
  }
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope))
  // Clean up legacy storage if present. This reduces long-term token exposure.
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY)
  }
}

function readEnvelope(raw: string | null): PersistedAuthPayload | null {
  if (!raw) return null
  const parsed = JSON.parse(raw) as unknown
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as PersistedEnvelope).expiresAtMs !== 'number' ||
    (parsed as PersistedEnvelope).expiresAtMs <= Date.now()
  ) {
    return null
  }
  if (!isValidPayload(parsed)) return null
  return {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
  }
}

/**
 * Backward-compatible session load:
 * - prefers versioned sessionStorage envelope with expiry
 * - one-time migrates valid legacy localStorage payload to sessionStorage
 */
export function loadPersistedSession(): PersistedAuthPayload | null {
  const storage = getStorage()
  if (!storage || typeof window === 'undefined') return null
  try {
    const active = readEnvelope(storage.getItem(SESSION_STORAGE_KEY))
    if (active) return active

    const legacyRaw = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY)
    if (!legacyRaw) return null

    const legacyParsed = JSON.parse(legacyRaw) as unknown
    if (!isValidPayload(legacyParsed)) {
      removeKeys(storage)
      return null
    }

    writeEnvelope(storage, legacyParsed)
    return legacyParsed
  } catch (error) {
    reportRuntimeError('auth-storage:load', error)
    try {
      removeKeys(storage)
    } catch (cleanupError) {
      reportRuntimeError('auth-storage:cleanup-after-load', cleanupError)
    }
    return null
  }
}

/** Sync Redux auth tokens to a short-lived session storage envelope. */
export function persistAuthState(token: string | null, refreshToken: string | null): void {
  const storage = getStorage()
  if (!storage) return

  try {
    if (token && refreshToken) {
      writeEnvelope(storage, { accessToken: token, refreshToken })
      return
    }
    removeKeys(storage)
  } catch (error) {
    reportRuntimeError('auth-storage:persist', error)
  }
}

export function clearPersistedSession(): void {
  persistAuthState(null, null)
}
