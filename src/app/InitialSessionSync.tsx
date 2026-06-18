import { useEffect } from 'react'
import { useStore } from 'react-redux'

import { logout } from '@/app/features/auth/authSlice'
import type { RootState } from '@/app/store'
import { useAppDispatch } from '@/app/redux-hooks'
import { getJwtExpSeconds } from '@/lib/jwt'
import { refreshSession } from '@/services/authSession'

/** Avoid duplicate refresh in React StrictMode (dev double-mount). */
let initialRefreshScheduled = false

/**
 * After localStorage rehydration, if the access token is expired or near expiry,
 * refresh once so the first API call does not always start with a 401.
 */
export function InitialSessionSync() {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()

  useEffect(() => {
    if (initialRefreshScheduled) return
    initialRefreshScheduled = true

    const { token, refreshToken } = store.getState().auth
    if (!token || !refreshToken) return

    const exp = getJwtExpSeconds(token)
    if (exp === null) return
    const now = Date.now() / 1000
    /** Refresh if expired or within 2 minutes of expiry */
    if (exp - now > 120) return

    void (async () => {
      const ok = await refreshSession(dispatch, () => store.getState())
      if (!ok) {
        dispatch(logout())
      }
    })()
  }, [dispatch, store])

  return null
}
