/**
 * Create React App exposes env vars prefixed with REACT_APP_ via process.env
 * @see https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  apiBaseUrl: requireEnv('REACT_APP_API_BASE_URL'),
  appName: process.env.REACT_APP_APP_NAME ?? 'Recovery Platform',
  mainSiteUrl:
    process.env.REACT_APP_MAIN_SITE_URL ?? 'https://recovery.tradeharmonizer.co.uk/login',
  tenantValidatePath: process.env.REACT_APP_TENANT_VALIDATE_PATH ?? '/tenants/validate',
  recoveryTenantValidatePath:
    process.env.REACT_APP_RECOVERY_TENANT_VALIDATE_PATH ?? '/recovery/tenants/validate',
  /**
   * Firebase (Cloud Messaging) config — same project as trade-harmonizer's frontend.
   * Optional: when unset, `src/lib/firebase.ts` skips init and real-time updates
   * (e.g. the Imports page) fall back to their safety-net poll only.
   */
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
  },
} as const
