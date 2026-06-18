import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from 'react-redux'

import { logout } from '@/app/features/auth/authSlice'
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/redux-hooks'
import { getJwtExpSeconds } from '@/lib/jwt'
import { refreshSession } from '@/services/authSession'

/** Refresh this many seconds before access token expiry while the tab is visible. */
const REFRESH_THRESHOLD_S = 5 * 60
const POLL_MS = 60_000

/**
 * Proactively refreshes the session while the user keeps the app open (interval + focus/visibility).
 */
export function useSessionRefresh() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const store = useStore<RootState>()
  const token = useAppSelector((s) => s.auth.token)
  const refreshToken = useAppSelector((s) => s.auth.refreshToken)
  const busy = useRef(false)

  useEffect(() => {
    if (!token || !refreshToken) return

    const maybeRefresh = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return

      const t = store.getState().auth.token
      const rt = store.getState().auth.refreshToken
      if (!t || !rt) return

      const exp = getJwtExpSeconds(t)
      if (exp === null) return
      const now = Date.now() / 1000
      if (exp - now > REFRESH_THRESHOLD_S) return

      if (busy.current) return
      busy.current = true
      try {
        const ok = await refreshSession(dispatch, () => store.getState())
        if (!ok) {
          dispatch(logout())
          navigate('/login', { replace: true })
        }
      } finally {
        busy.current = false
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void maybeRefresh()
    }

    void maybeRefresh()
    const interval = setInterval(() => void maybeRefresh(), POLL_MS)
    window.addEventListener('focus', maybeRefresh)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', maybeRefresh)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [dispatch, navigate, store, token, refreshToken])
}
