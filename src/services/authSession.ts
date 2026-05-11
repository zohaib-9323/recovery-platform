import type { Dispatch } from '@reduxjs/toolkit'

import { applyTokens } from '@/app/features/auth/authSlice'
import { reportRuntimeError } from '@/lib/error-reporting'
import { recoveryAuthSchema } from '@/lib/schemas/api'
import type { RecoveryAuthEnvelope } from '@/types/auth-api'
import { env } from '@/utils/env'

type GetAuthSlice = () => { auth: { refreshToken: string | null } }

const baseUrl = () => env.apiBaseUrl.replace(/\/$/, '')

/**
 * Refreshes access/refresh tokens using the refresh endpoint (plain fetch — avoids RTK 401 loops).
 */
export async function refreshSession(dispatch: Dispatch, getState: GetAuthSlice): Promise<boolean> {
  const refreshToken = getState().auth.refreshToken
  if (!refreshToken) return false

  const res = await fetch(`${baseUrl()}/recovery/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) return false

  let data: RecoveryAuthEnvelope
  try {
    data = recoveryAuthSchema.parse(await res.json()) as RecoveryAuthEnvelope
  } catch (error) {
    reportRuntimeError('auth-session:parse-refresh-response', error)
    return false
  }

  const access = data?.content?.access_token
  const nextRefresh = data?.content?.refresh_token ?? refreshToken
  if (!access) return false

  dispatch(applyTokens({ accessToken: access, refreshToken: nextRefresh }))
  return true
}
