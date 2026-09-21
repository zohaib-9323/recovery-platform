import {
  isImportStatusNotification,
  notificationToastType,
  stripBoldMarkers,
} from '@/lib/notificationToasts'
import type { RecoveryNotificationRecord } from '@/types/recovery-notifications-api'

const record = (over: Partial<RecoveryNotificationRecord> = {}): RecoveryNotificationRecord => ({
  _id: 'n1',
  title: 'Import Completed',
  description: 'Import complete. 4 email(s) added.',
  isRead: false,
  ...over,
})

describe('stripBoldMarkers', () => {
  it('removes the bell menu emphasis markers', () => {
    expect(stripBoldMarkers('Mailbox import for [bold]"a@b.com"[/bold].')).toBe(
      'Mailbox import for "a@b.com".',
    )
  })

  it('leaves unmarked copy untouched', () => {
    expect(stripBoldMarkers('Import complete.')).toBe('Import complete.')
  })
})

describe('isImportStatusNotification', () => {
  it('detects the import status payload', () => {
    expect(
      isImportStatusNotification(record({ options: { type: 'm365_import_status_update' } })),
    ).toBe(true)
  })

  it('ignores other notifications', () => {
    expect(isImportStatusNotification(record({ options: { shipmentId: 'abc' } }))).toBe(false)
    expect(isImportStatusNotification(record())).toBe(false)
  })
})

describe('notificationToastType', () => {
  it('maps import outcomes to a matching toast colour', () => {
    const withStatus = (status: string) =>
      notificationToastType(record({ options: { type: 'm365_import_status_update', status } }))

    expect(withStatus('completed')).toBe('success')
    expect(withStatus('failed')).toBe('error')
    expect(withStatus('running')).toBe('info')
    expect(withStatus('retrying')).toBe('info')
  })

  it('falls back to info for everything that is not an import status', () => {
    expect(notificationToastType(record({ options: { shipmentId: 'abc' } }))).toBe('info')
  })
})
