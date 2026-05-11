import { reportRuntimeError } from '@/lib/error-reporting'

/** IANA timezone ids for preferences (falls back if `Intl.supportedValuesOf` is unavailable). */
const FALLBACK_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export function listTimezones(): string[] {
  try {
    const supported = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf?.('timeZone')
    if (Array.isArray(supported) && supported.length > 0) return supported
  } catch (error) {
    reportRuntimeError('timezones:list', error)
  }
  return FALLBACK_TIMEZONES
}
