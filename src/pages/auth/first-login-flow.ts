const FIRST_LOGIN_FLOW_STORAGE_KEY = 'recovery:first-login-flow'

export type FirstLoginFlowState = {
  email: string
  temporaryPassword: string
  setupToken?: string
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
      temporaryPassword?: unknown
      setupToken?: unknown
    }

    if (!isNonEmptyString(parsed.email) || !isNonEmptyString(parsed.temporaryPassword)) {
      return null
    }

    return {
      email: parsed.email.trim(),
      temporaryPassword: parsed.temporaryPassword,
      setupToken: isNonEmptyString(parsed.setupToken) ? parsed.setupToken.trim() : undefined,
    }
  } catch {
    return null
  }
}

export function clearFirstLoginFlowState(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(FIRST_LOGIN_FLOW_STORAGE_KEY)
}
