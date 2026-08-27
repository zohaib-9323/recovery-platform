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
   * First-login (OTP → set password) UI demo mode. The backend endpoints for
   * this flow don't exist yet, so when this is on the demo account below is
   * served entirely client-side by `src/pages/auth/first-login-mock.ts` — no
   * network calls. Every other email still hits the real login API.
   *
   * Defaults ON under `npm start` (NODE_ENV=development) so the flow is
   * clickable with no setup, and OFF in `npm run build` (NODE_ENV=production)
   * so it can never reach a deployed environment. `REACT_APP_FIRST_LOGIN_MOCK`
   * overrides both directions — set it to `false` locally to exercise the real
   * login API against this account instead.
   *
   * Delete this flag (and the mock module) once the API ships.
   */
  firstLoginMock: process.env.REACT_APP_FIRST_LOGIN_MOCK
    ? process.env.REACT_APP_FIRST_LOGIN_MOCK === 'true'
    : process.env.NODE_ENV === 'development',
  /**
   * The demo credentials are written as inline `NODE_ENV` ternaries so the
   * minifier folds them away entirely in a production build — a hardcoded
   * email/password pair should not sit in a shipped bundle even as dead code.
   * Empty in production, which also stops the mock matching anything.
   */
  firstLoginMockEmail:
    process.env.REACT_APP_FIRST_LOGIN_MOCK_EMAIL ??
    (process.env.NODE_ENV === 'development' ? 'shahzad.abbas@devexcelit.com' : ''),
  firstLoginMockPassword:
    process.env.REACT_APP_FIRST_LOGIN_MOCK_PASSWORD ??
    (process.env.NODE_ENV === 'development' ? 'Test@123' : ''),
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
