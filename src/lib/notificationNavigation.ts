import type { RecoveryNotificationRecord } from '@/types/recovery-notifications-api'

/**
 * Maps a recovery notification's screenName + options.shipmentId to an in-app route.
 * Mirrors trade-harmonizer's resolveNotificationTarget, scoped to this app's routes
 * (see src/app/router.tsx: shipment detail lives at /shipments/:id).
 */
export function resolveRecoveryNotificationPath(item: RecoveryNotificationRecord): string | null {
  const screenName = item.screenName || ''
  const shipmentId = item.options?.shipmentId

  if (screenName === '/shipments') {
    return shipmentId ? `/shipments/${shipmentId}` : '/shipments'
  }

  return screenName || null
}
