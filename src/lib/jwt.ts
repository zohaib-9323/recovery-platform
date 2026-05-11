import type { User } from '@/types'
import { reportRuntimeError } from '@/lib/error-reporting'

type JwtPayload = {
  sub?: string
  email?: string
  recoveryUserId?: string
  exp?: number
  iat?: number
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JwtPayload
  } catch (error) {
    reportRuntimeError('jwt:decode', error)
    return null
  }
}

/** Returns Unix expiry (seconds), or null if missing. */
export function getJwtExpSeconds(accessToken: string): number | null {
  const p = decodeJwtPayload(accessToken)
  return typeof p?.exp === 'number' ? p.exp : null
}

export function userFromAccessToken(accessToken: string): User | null {
  const p = decodeJwtPayload(accessToken)
  if (!p) return null
  const id = p.recoveryUserId ?? p.sub
  const email = p.email
  if (!id || !email) return null
  const localPart = email.split('@')[0] ?? email
  const displayName = localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
  return {
    id,
    email,
    displayName: displayName || undefined,
  }
}
