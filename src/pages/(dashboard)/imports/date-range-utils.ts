export const MAX_RANGE_DAYS = 90
export const LOOKBACK_YEARS = 3

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function getDaysSelected(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY)
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
