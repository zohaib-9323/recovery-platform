/**
 * Best-effort runtime error reporting without changing user-facing behavior.
 * Uses `reportError` when available so production errors are still observable.
 */
export function reportRuntimeError(context: string, error: unknown): void {
  const normalized =
    error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error')
  const wrapped = new Error(`[${context}] ${normalized.message}`, { cause: normalized })

  if (typeof globalThis.reportError === 'function') {
    globalThis.reportError(wrapped)
  }
}
