const FIRST_LOGIN_FLOW_STORAGE_KEY = 'recovery:first-login-flow'

/**
 * State carried across the first-login screens (login → OTP → set password).
 *
 * Deliberately holds no password: the temporary password is re-typed by the
 * user on the set-password screen (same as trade-harmonizer's
 * `setup-password-form.tsx`), so nothing credential-shaped is persisted here.
 * `setupToken` is added once the OTP verifies.
 */
export type FirstLoginFlowState = {
  email: string
  setupToken?: string
  /**
   * Set when this OTP/setup run was entered from `SignupPage` rather than the
   * login page's first-login mock — lets `FirstLoginVerifyOtpPage` show the
   * signup stepper without affecting the original first-login flow.
   */
  fromSignup?: boolean
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function saveFirstLoginFlowState(state: FirstLoginFlowState): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(FIRST_LOGIN_FLOW_STORAGE_KEY, JSON.stringify(state))
}

export function readFirstLoginFlowState(): FirstLoginFlowState | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(FIRST_LOGIN_FLOW_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as {
      email?: unknown
      setupToken?: unknown
      fromSignup?: unknown
    }

    if (!isNonEmptyString(parsed.email)) {
      return null
    }

    return {
      email: parsed.email.trim(),
      setupToken: isNonEmptyString(parsed.setupToken) ? parsed.setupToken.trim() : undefined,
      fromSignup: parsed.fromSignup === true,
    }
  } catch {
    return null
  }
}

export function clearFirstLoginFlowState(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(FIRST_LOGIN_FLOW_STORAGE_KEY)
}
