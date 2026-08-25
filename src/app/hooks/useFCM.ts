import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { isSupported, onMessage, type MessagePayload } from 'firebase/messaging'

import { getFCMToken, messaging } from '@/lib/firebase'
import { IMPORT_LIST_REFRESH_EVENT, shouldRefreshImportListFromFcmData } from '@/lib/importRealtime'
import { reportRuntimeError } from '@/lib/error-reporting'
import { useAuth } from '@/app/hooks/useAuth'
import { useRegisterRecoveryFcmTokenMutation } from '@/app/services/recoveryNotificationsApi'

type UseFCMReturn = {
  fcmToken: string | null
  notificationPermission: NotificationPermission | 'default'
  requestNotificationPermission: () => Promise<void>
}

/**
 * Foreground Firebase Cloud Messaging — mirrors trade-harmonizer's `useFCM` hook (same
 * Firebase project). Mounted once per authenticated session (see DashboardLayout).
 *
 * Firebase only supports one active `onMessage` handler at a time; this hook owns that
 * slot and forwards relevant pushes as a window event so page-level hooks (e.g. the
 * Imports page's realtime refresh) can react without registering their own listener.
 */
export function useFCM(): UseFCMReturn {
  const { isAuthenticated } = useAuth()
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'default'
  >(() =>
    typeof Notification !== 'undefined' && 'permission' in Notification
      ? Notification.permission
      : 'default',
  )
  const [registerFcmToken] = useRegisterRecoveryFcmTokenMutation()

  const requestNotificationPermission = async (): Promise<void> => {
    if (typeof Notification === 'undefined' || !Notification.requestPermission) return

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        setFcmToken(await getFCMToken())
      }
    } catch (error) {
      reportRuntimeError('useFCM:request-permission', error)
    }
  }

  // Ask once per browser: if the user has never been prompted, request permission as soon
  // as the dashboard mounts so pushes are available without a separate settings step. Once
  // granted (here or by a returning user who already decided), pick up an FCM token.
  useEffect(() => {
    if (notificationPermission === 'default') {
      if (typeof Notification === 'undefined' || !Notification.requestPermission) return
      Notification.requestPermission()
        .then((permission) => setNotificationPermission(permission))
        .catch((error) => reportRuntimeError('useFCM:request-permission', error))
      return
    }

    if (notificationPermission === 'granted') {
      getFCMToken()
        .then(setFcmToken)
        .catch((error) => reportRuntimeError('useFCM:get-token', error))
    }
  }, [notificationPermission])

  // Register the single onMessage listener once Firebase Messaging is available.
  useEffect(() => {
    if (!messaging) return

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    isSupported().then((supported) => {
      if (!supported || cancelled || !messaging) return

      unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
        if (payload?.notification?.title) {
          toast.info(
            `${payload.notification.title}${payload.notification.body ? ` — ${payload.notification.body}` : ''}`,
          )
        }

        if (shouldRefreshImportListFromFcmData(payload.data)) {
          window.dispatchEvent(new Event(IMPORT_LIST_REFRESH_EVENT))
        }
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  // Register the FCM token with the backend once we have both a token and a logged-in user.
  useEffect(() => {
    if (!fcmToken || !isAuthenticated) return
    registerFcmToken({ token: fcmToken }).catch((error) =>
      reportRuntimeError('useFCM:register-token', error),
    )
  }, [fcmToken, isAuthenticated, registerFcmToken])

  return { fcmToken, notificationPermission, requestNotificationPermission }
}
