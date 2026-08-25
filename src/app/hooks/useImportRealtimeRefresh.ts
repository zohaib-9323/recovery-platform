import { useCallback, useEffect, useRef } from 'react'

import { IMPORT_LIST_REFRESH_EVENT, shouldRefreshImportListFromFcmData } from '@/lib/importRealtime'

const DEBOUNCE_MS = 400

/**
 * Keeps an Imports RTK Query subscription fresh in real time instead of tight polling:
 * - FCM foreground messages (useFCM owns Firebase's single onMessage slot and forwards
 *   m365_import_status_update pushes via a window event — see importRealtime.ts)
 * - Service worker postMessage when the tab is backgrounded (firebase-messaging-sw.js)
 *
 * A slow fallback poll is still applied by the caller via RTK Query's `pollingInterval`
 * (see ImportsPage / ImportJobDetailPage) as a safety net for missed pushes.
 */
export function useImportRealtimeRefresh(refetch: () => void, enabled = true): void {
  const refetchRef = useRef(refetch)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  const refreshNow = useCallback(() => {
    if (!enabled) return
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => refetchRef.current(), DEBOUNCE_MS)
  }, [enabled])

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!enabled) return
    window.addEventListener(IMPORT_LIST_REFRESH_EVENT, refreshNow)
    return () => window.removeEventListener(IMPORT_LIST_REFRESH_EVENT, refreshNow)
  }, [enabled, refreshNow])

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.serviceWorker) return

    const onSwMessage = (event: MessageEvent) => {
      if (
        event.data?.type === 'RECOVERY_FCM_MESSAGE' &&
        shouldRefreshImportListFromFcmData(event.data.data)
      ) {
        refreshNow()
      }
    }

    navigator.serviceWorker.addEventListener('message', onSwMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage)
  }, [enabled, refreshNow])
}
