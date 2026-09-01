import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/hooks/useAuth'
import { useGetRecoveryNotificationsQuery } from '@/app/services/recoveryNotificationsApi'
import { IMPORT_LIST_REFRESH_EVENT } from '@/lib/importRealtime'
import { resolveRecoveryNotificationPath } from '@/lib/notificationNavigation'
import {
  MAX_TOASTS_PER_TICK,
  NOTIFICATION_REFRESH_EVENT,
  NOTIFICATION_TOAST_LIMIT,
  isImportStatusNotification,
  notificationToastType,
  stripBoldMarkers,
} from '@/lib/notificationToasts'
import { showCustomToast } from '@/lib/showCustomToast'
import type { RecoveryNotificationRecord } from '@/types/recovery-notifications-api'

const POLL_MS = 20_000

/** Cap on remembered ids so a long session can't grow the set without bound. */
const SEEN_IDS_CAP = 200

/**
 * Pops a toast for every notification that arrives while the app is open, and nudges
 * the Imports screens to refresh when that notification is an import status update.
 *
 * ## Why this polls instead of listening to FCM
 *
 * Push delivery is best-effort: it needs browser notification permission, a registered
 * service worker and a live Firebase config, and silently delivers nothing when any of
 * those is missing (the deployed symptom this hook fixes — import notifications reached
 * the bell menu, which polls, but never popped a toast, and the job status never
 * auto-refreshed). The notification list is the authoritative record — the backend writes
 * it *before* pushing — so watching it catches every notification regardless of push state.
 *
 * FCM is still the fast path: useFCM dispatches NOTIFICATION_REFRESH_EVENT on arrival and
 * this hook refetches immediately rather than waiting out the poll interval. Because the
 * toast is raised here in both cases, a push can never produce a duplicate toast.
 *
 * Mounted once per authenticated session (see DashboardLayout).
 */
export function useNotificationToasts(): void {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const { data, refetch } = useGetRecoveryNotificationsQuery(
    { limit: NOTIFICATION_TOAST_LIMIT },
    { skip: !isAuthenticated, pollingInterval: POLL_MS },
  )

  // null until the first response establishes a baseline. Everything already in the list
  // when the app opens is history, not news — toasting it would greet every login with a
  // stack of stale popups.
  const seenIdsRef = useRef<Set<string> | null>(null)

  const refetchRef = useRef(refetch)
  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  const navigateRef = useRef(navigate)
  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  // Forget the baseline on sign-out so the next user doesn't inherit it.
  useEffect(() => {
    if (!isAuthenticated) seenIdsRef.current = null
  }, [isAuthenticated])

  const toastFor = useCallback((item: RecoveryNotificationRecord) => {
    const path = resolveRecoveryNotificationPath(item)
    showCustomToast({
      type: notificationToastType(item),
      title: item.title,
      message: stripBoldMarkers(item.description ?? ''),
      ...(path ? { options: { onClick: () => navigateRef.current(path) } } : {}),
    })
  }, [])

  // A push tells us something changed; the list tells us what it was.
  useEffect(() => {
    if (!isAuthenticated) return
    const onRefresh = () => void refetchRef.current()
    window.addEventListener(NOTIFICATION_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(NOTIFICATION_REFRESH_EVENT, onRefresh)
  }, [isAuthenticated])

  useEffect(() => {
    const records = data?.content?.data
    if (!records) return

    if (seenIdsRef.current === null) {
      seenIdsRef.current = new Set(records.map((item) => item._id))
      return
    }

    const seen = seenIdsRef.current
    const fresh = records.filter((item) => !seen.has(item._id))
    if (fresh.length === 0) return

    fresh.forEach((item) => seen.add(item._id))
    if (seen.size > SEEN_IDS_CAP) {
      // Ids only ever leave the newest-first window as newer ones push them out, so
      // rebuilding from what's currently visible can't resurrect an already-toasted one.
      seenIdsRef.current = new Set(records.map((item) => item._id))
    }

    // The API returns newest first; toast oldest first so the newest ends up on top,
    // and drop the excess from the oldest end when a burst arrives.
    const ordered = [...fresh].reverse().slice(-MAX_TOASTS_PER_TICK)
    ordered.forEach(toastFor)

    // Import status changed → let the Imports list/detail screens repaint. This is what
    // keeps the job status live when push isn't reaching the browser at all.
    if (fresh.some(isImportStatusNotification)) {
      window.dispatchEvent(new Event(IMPORT_LIST_REFRESH_EVENT))
    }
  }, [data, toastFor])
}
