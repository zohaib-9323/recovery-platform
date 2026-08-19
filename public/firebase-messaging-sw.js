// Runs as a raw script (no build step, no env vars) — config is hardcoded here the
// same way trade-harmonizer's public/firebase-messaging-sw.js does it. Same Firebase
// project as the main app; these are client-side web config values, not secrets.
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyC6YtePzrACqq-6YWLoIOF818k1vNL_kEg',
  authDomain: 'trade-harmonizer.firebaseapp.com',
  projectId: 'trade-harmonizer',
  storageBucket: 'trade-harmonizer.firebasestorage.app',
  messagingSenderId: '973540576067',
  appId: '1:973540576067:web:5ff5bbeaa3318263e5fdf6',
  measurementId: 'G-48VYSM2ENJ',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Recovery Platform'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: payload.data || {},
  }

  self.registration.showNotification(notificationTitle, notificationOptions)

  // Notify open tabs so pages (e.g. Imports) can refetch without a full page reload.
  // Generic envelope — listeners filter on `data.type` (see src/lib/importRealtime.ts).
  self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'RECOVERY_FCM_MESSAGE',
          data: payload.data || {},
        })
      })
    })
    .catch(() => {
      // Best-effort — a missed background refresh is covered by the page's fallback poll.
    })
})
