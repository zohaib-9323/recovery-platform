/**
 * TEMPORARY — client-side stand-in for the first-login (OTP → set password)
 * backend endpoints, which don't exist yet.
 *
 * Enabled only when `REACT_APP_FIRST_LOGIN_MOCK=true`. It answers for exactly
 * one demo account (`env.firstLoginMockEmail` / `env.firstLoginMockPassword`);
 * every other login still goes to the real API, and with the flag off this
 * module is inert. Delete this file and its call sites in `LoginPage`,
 * `FirstLoginVerifyOtpPage` and `FirstLoginSetupPasswordPage` once
 * `/recovery/auth/first-login/*` is live — the RTK Query hooks it shadows are
 * already wired in `recoveryApi.ts`.
 */
import { env } from '@/utils/env'

/** OTP that deliberately fails, so the error state is demoable. */
const REJECTED_OTP = '000000'
const MOCK_SETUP_TOKEN = 'mock-setup-token'
const MOCK_LATENCY_MS = 600

/** Shaped like an RTK Query `FetchBaseQueryError` so callers parse it unchanged. */
type MockApiError = { status: number; data: { statusCode: number; message: string } }

function mockError(statusCode: number, message: string): MockApiError {
  return { status: statusCode, data: { statusCode, message } }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isFirstLoginMockEnabled(): boolean {
  return env.firstLoginMock && env.firstLoginMockEmail.length > 0
}

/** True when this email/password is the demo account the mock owns. */
export function isMockFirstLoginAccount(email: string, password: string): boolean {
  if (!isFirstLoginMockEnabled()) return false
  return (
    email.trim().toLowerCase() === env.firstLoginMockEmail.trim().toLowerCase() &&
    password === env.firstLoginMockPassword
  )
}

/** True when the email is the demo account, whatever password was typed. */
export function isMockFirstLoginEmail(email: string): boolean {
  if (!isFirstLoginMockEnabled()) return false
  return email.trim().toLowerCase() === env.firstLoginMockEmail.trim().toLowerCase()
}

/** Stands in for `POST /recovery/auth/first-login/request-otp`. */
export async function mockRequestFirstLoginOtp(): Promise<void> {
  await delay(MOCK_LATENCY_MS)
}

/** Stands in for `POST /recovery/auth/first-login/verify-otp`. */
export async function mockVerifyFirstLoginOtp(otp: string): Promise<{ setupToken: string }> {
  await delay(MOCK_LATENCY_MS)
  if (otp === REJECTED_OTP) {
    throw mockError(400, 'Invalid or expired OTP. Please try again.')
  }
  return { setupToken: MOCK_SETUP_TOKEN }
}

/** Stands in for `POST /recovery/auth/first-login/setup-password`. */
export async function mockSetupFirstLoginPassword(temporaryPassword: string): Promise<void> {
  await delay(MOCK_LATENCY_MS)
  if (temporaryPassword !== env.firstLoginMockPassword) {
    throw mockError(400, 'Temporary password is incorrect.')
  }
}
