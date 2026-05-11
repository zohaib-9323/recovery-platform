const extractTimeZone = (zoneString: string | null | undefined): string => {
  const match = zoneString?.match(/- ([A-Za-z/_]+)/)
  if (match) return match[1]
  if (zoneString && zoneString.trim()) return zoneString.trim()
  return 'UTC'
}

/** Same behavior as trade-harmonizer `formatDate` for shipment list cells. */
export function formatShipmentListDate(
  dateString?: string | null,
  timeZone?: string | null,
): string {
  if (!dateString) return 'N/A'

  const dateObj = new Date(dateString)
  const tz = extractTimeZone(timeZone)

  return dateObj
    .toLocaleDateString('en-US', {
      timeZone: tz,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
    .replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3')
}

export function getCurrencySymbol(code?: string): string {
  if (!code) return ''
  switch (code) {
    case 'GBP':
      return '£'
    case 'USD':
      return '$'
    case 'CNY':
      return '¥'
    case 'EUR':
      return '€'
    default:
      return ''
  }
}
