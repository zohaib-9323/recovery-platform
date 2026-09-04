export class AppError extends Error {
  readonly code: string
  readonly userMessage: string
  readonly details?: unknown

  constructor(message: string, userMessage: string, code = 'APP_ERROR', details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.userMessage = userMessage
    this.details = details
  }
}

type ErrorWithData = {
  data?: unknown
  status?: unknown
  error?: unknown
}

function readMessageFromData(data: unknown): string | null {
  if (!data) return null
  if (typeof data === 'string' && data.trim().length > 0) return data
  if (typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) return message
  }
  return null
}

export function normalizeApiError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error
  if (error instanceof Error) {
    return new AppError(error.message, fallback, 'RUNTIME_ERROR', error)
  }

  if (error && typeof error === 'object') {
    const typed = error as ErrorWithData
    const message = readMessageFromData(typed.data) ?? readMessageFromData(typed.error) ?? fallback
    return new AppError(message, message, 'API_ERROR', error)
  }

  return new AppError(fallback, fallback, 'UNKNOWN_ERROR', error)
}

/**
 * Whether an RTK Query error is an HTTP 409.
 *
 * `status` is typed `unknown` because RTK Query also uses it for transport
 * failures (`'FETCH_ERROR'`, `'PARSING_ERROR'`), so it is not always a number.
 * Callers use this to pin a conflict to the field that caused it — e.g. a
 * signup rejected because the email, or its company domain, is already taken.
 */
export function isConflictError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  return (error as ErrorWithData).status === 409
}
