export const MAX_RANGE_DAYS = 90
export const LOOKBACK_YEARS = 3

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Returns 23:59:59.999 of the given date in local time.
 * Use this when building the dateRangeEnd for the API — so that selecting
 * "Aug 18 → Aug 18" covers the full day, not a zero-length window.
 */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/**
 * Returns the inclusive day count for the selected range.
 * "Aug 18 → Aug 18" = 1 day, "Aug 18 → Aug 19" = 2 days, etc.
 */
export function getDaysSelected(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatShortDateRange(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  const end = endDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${start} - ${end}`
}
