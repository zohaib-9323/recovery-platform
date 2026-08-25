/** Dispatched on window when the Imports pages should refetch (FCM / service worker). */
export const IMPORT_LIST_REFRESH_EVENT = 'import-list-refresh'

/** FCM data.type sent by the backend when an M365 import job's status changes
 *  (see trade-harmonizer-be `m365-import-status-fcm.util.ts`). */
export const IMPORT_STATUS_FCM_EVENT_TYPE = 'm365_import_status_update'

export function shouldRefreshImportListFromFcmData(
  data: Record<string, string | undefined> | undefined,
): boolean {
  if (!data) return false
  return data.type === IMPORT_STATUS_FCM_EVENT_TYPE
}
