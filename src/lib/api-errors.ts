/** Extract a readable message from RTK Query / fetch errors. */
export function getRtkErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const m = (data as { message?: unknown }).message
      if (typeof m === 'string' && m.length > 0) return m
    }
    if (typeof data === 'string' && data.length > 0) return data
  }
  return 'Something went wrong. Please try again.'
}
