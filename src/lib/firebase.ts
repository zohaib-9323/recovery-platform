import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging'

import { env } from '@/utils/env'
import { reportRuntimeError } from '@/lib/error-reporting'

/**
 * Firebase Cloud Messaging client — mirrors trade-harmonizer's `_config/firebase.ts`
 * (same Firebase project). Only Messaging is used here; Recovery Platform doesn't need
 * Firebase Auth/Firestore/Storage.
 *
 * Config is optional: if env vars aren't set, `app`/`messaging` stay null and callers
 * (useFCM) no-op — real-time pages fall back to their safety-net poll only.
 */
const hasFirebaseConfig = Boolean(
  env.firebase.apiKey && env.firebase.projectId && env.firebase.appId,
)

let app: FirebaseApp | null = null
if (hasFirebaseConfig) {
  app = initializeApp({
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
    measurementId: env.firebase.measurementId,
  })
}

// Messaging only exists in a browser context with a registered service worker.
let messaging: Messaging | null = null
if (app && typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    reportRuntimeError('firebase:init-messaging', error)
  }
}

export { messaging }

export async function isFcmSupported(): Promise<boolean> {
  if (!messaging) return false
  try {
    return await isSupported()
  } catch {
    return false
  }
}

/** Registers the FCM service worker and returns a device token, or null if unavailable. */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) return null
  if (!env.firebase.vapidKey) {
    reportRuntimeError('firebase:get-token', new Error('REACT_APP_FIREBASE_VAPID_KEY is not set'))
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const currentToken = await getToken(messaging, {
      vapidKey: env.firebase.vapidKey,
      serviceWorkerRegistration: registration,
    })
    return currentToken || null
  } catch (error) {
    reportRuntimeError('firebase:get-token', error)
    return null
  }
}
