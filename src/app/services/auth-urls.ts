// Single source of truth for recovery auth endpoints that must bypass the
// Authorization header and the 401 refresh-and-retry flow (you are not yet
// authenticated when calling them). Used by both recoveryApi.ts and reauth.ts.
const AUTH_URL_FRAGMENTS = [
  '/recovery/auth/login',
  '/recovery/auth/refresh',
  '/recovery/auth/request-password-reset',
  '/recovery/auth/reset-password',
  '/recovery/auth/first-login/verify-otp',
  '/recovery/auth/first-login/request-otp',
  '/recovery/auth/first-login/setup-password',
]

export function isAuthUrl(url: string | undefined): boolean {
  if (!url) return false
  return AUTH_URL_FRAGMENTS.some((fragment) => url.includes(fragment))
}
