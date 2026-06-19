export const shipmentLogHeadingTitles = ['Date & Time', 'Activity Type', 'Description'] as const

export function shipmentLogStatusColor(status: string): string {
  switch (status) {
    case 'green':
      return 'bg-green'
    case 'orange':
      return 'bg-orange'
    case 'gray':
      return 'bg-crystalBlue'
    case 'blue':
      return 'bg-pearlyPurple'
    case 'purple':
      return 'bg-purple'
    default:
      return 'bg-yellow'
  }
}

export function formatLogValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item === null || item === undefined) return ''
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return String(item)
        }
        try {
          return JSON.stringify(item)
        } catch {
          return '[object]'
        }
      })
      .filter(Boolean)
      .join(', ')
  }
  try {
    return JSON.stringify(value)
  } catch {
    return '[object]'
  }
}

const extractTimeZone = (zoneString: string | null | undefined): string => {
  const match = zoneString?.match(/- ([A-Za-z/_]+)/)
  if (match) return match[1]
  if (zoneString && zoneString.trim()) return zoneString.trim()
  return 'UTC'
}

export function formatLogDisplayDate(
  dateString?: string | null,
  timeZone?: string | null,
  emptyFallback = 'N/A',
): string {
  if (!dateString) return emptyFallback

  const dateObj = new Date(dateString)
  if (Number.isNaN(dateObj.getTime())) return String(dateString)

  return dateObj.toLocaleDateString('en-GB', {
    timeZone: extractTimeZone(timeZone),
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function isLogDateToday(dateString?: string | null, timeZone?: string | null): boolean {
  if (!dateString) return false

  const dateObj = new Date(dateString)
  if (Number.isNaN(dateObj.getTime())) return false

  const tz = extractTimeZone(timeZone)
  const today = new Date()
  const todayParts = today.toLocaleDateString('en-GB', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const itemParts = dateObj.toLocaleDateString('en-GB', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return todayParts === itemParts
}
