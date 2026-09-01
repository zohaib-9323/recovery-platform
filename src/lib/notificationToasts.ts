import type { RecoveryNotificationRecord } from '@/types/recovery-notifications-api'
import { IMPORT_STATUS_FCM_EVENT_TYPE } from '@/lib/importRealtime'
import type { ToastType } from '@/lib/showCustomToast'

/**
 * Dispatched on window when a push has arrived and the notification list should be
 * refetched immediately instead of waiting for the next poll (see useNotificationToasts).
 */
export const NOTIFICATION_REFRESH_EVENT = 'recovery-notification-refresh'

/** How many of the newest notifications the toast watcher keeps in view. */
export const NOTIFICATION_TOAST_LIMIT = 5

/** Never fire more than this many toasts from a single poll — a backlog of ten
 *  notifications arriving at once should not bury the screen. */
export const MAX_TOASTS_PER_TICK = 3

/**
 * Backend notification copy marks emphasis with `[bold]…[/bold]` (the bell menu renders
 * those as <strong>). The toast is plain text, so the markers are stripped rather than
 * shown literally.
 */
export function stripBoldMarkers(text: string): string {
  return text.replace(/\[\/?bold\]/g, '')
}

/** True for the `m365_import_status_update` payload the import processor attaches. */
export function isImportStatusNotification(item: RecoveryNotificationRecord): boolean {
  return item.options?.type === IMPORT_STATUS_FCM_EVENT_TYPE
}

/**
 * Colour of the toast. Import job status is the one case with a real outcome to
 * signal — a completed import is a success, a failed one is an error; everything
 * else is neutral information.
 */
export function notificationToastType(item: RecoveryNotificationRecord): ToastType {
  if (!isImportStatusNotification(item)) return 'info'

  const status = String(item.options?.status ?? '').toLowerCase()
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'error'
  return 'info'
}
