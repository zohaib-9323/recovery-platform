import { normalizeApiError } from '@/lib/api-error'

/** Extract a readable message from RTK Query / fetch errors. */
export function getErrorMessage(err: unknown, fallback: string): string {
  return normalizeApiError(err, fallback).userMessage
}

export function getRtkErrorMessage(err: unknown): string {
  return getErrorMessage(err, 'Something went wrong. Please try again.')
}
