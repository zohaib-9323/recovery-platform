/**
 * Email format (practical subset; local + domain labels).
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return EMAIL_REGEX.test(trimmed)
}

/** Password: at least 8 characters, one uppercase, one lowercase, one number, one special character. */
export function isValidPassword(value: string): boolean {
  if (value.length < 8) return false
  if (!/[a-z]/.test(value)) return false
  if (!/[A-Z]/.test(value)) return false
  if (!/\d/.test(value)) return false
  // Non-alphanumeric counts as special (punctuation, symbols, etc.)
  if (!/[^A-Za-z0-9]/.test(value)) return false
  return true
}

export const PASSWORD_RULES_HINT =
  'At least 8 characters with uppercase, lowercase, number, and special character.'
