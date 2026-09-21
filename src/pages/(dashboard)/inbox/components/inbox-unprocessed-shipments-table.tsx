import { RefreshCw, Trash2 } from 'lucide-react'

import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
import { documentTypeLabel } from '@/pages/(dashboard)/inbox/inbox-mappers'
import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'

const thCell =
  'px-3 py-3 text-left text-[13px] font-normal leading-[100%] tracking-[0] text-[#000000]'
const tdCell = 'px-3 py-3 text-[14px] font-normal leading-[100%] tracking-[0] text-[#000000]'

export type InboxUnprocessedShipmentsTableProps = {
  rows: InboxUnprocessedShipmentRow[]
  onConvertToProcessable?: (unprocessableIndex: number) => Promise<void> | void
  convertingIndex?: number | null
  onRetry?: (row: InboxUnprocessedShipmentRow) => Promise<void> | void
  retryingIndex?: number | null
  className?: string
  /** Overrides the default fixed-height scroll wrapper (`max-h-[360px] overflow-auto`) — pass e.g. `''` for a full-height list that scrolls with its page instead. */
  scrollWrapperClassName?: string
  /**
   * Shows File Name / Status / Type instead of the default File Name / Type /
   * Status, and drops the Actions column *unless* `onDelete` is supplied. Used
   * by the cross-import Unprocessed Documents view, which has no retry endpoint
   * to call for cross-import rows but can still delete them.
   */
  hideActionsColumn?: boolean
  /**
   * Permanently deletes the row's file. Optional: a caller that omits it gets
   * no delete control rather than a dead one. The row carries the
   * `documentId`/`sourceIndex`/`s3Key` the caller needs to address the entry.
   */
  onDelete?: (row: InboxUnprocessedShipmentRow) => Promise<void> | void
  deletingIndex?: number | null
}

export function InboxUnprocessedShipmentsTable({
  rows,
  convertingIndex = null,
  onRetry,
  retryingIndex = null,
  className,
  scrollWrapperClassName = 'max-h-[360px] overflow-auto',
  hideActionsColumn = false,
  onDelete,
  deletingIndex = null,
}: InboxUnprocessedShipmentsTableProps) {
  const { t } = useI18n()
  // The compact layout still earns an Actions column once there is an action to
  // put in it — an empty header would just be noise.
  const showCompactActions = hideActionsColumn && Boolean(onDelete)
  if (rows.length === 0) {
    return <p className="text-base font-light text-blackFive">{t('inbox.unprocessed.empty')}</p>
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-hidden rounded-lg border border-[#E0E0E0]">
        <div className={scrollWrapperClassName}>
          <table className="w-full bg-white">
            <thead className="sticky top-0 z-10 bg-[#F8F8F8]">
              <tr>
                <th className={thCell}>{t('inbox.unprocessed.col.fileName')}</th>
                {hideActionsColumn ? (
                  <>
                    <th className={thCell}>{t('inbox.unprocessed.col.status')}</th>
                    <th className={thCell}>{t('inbox.unprocessed.col.type')}</th>
                    {showCompactActions ? (
                      <th className={thCell}>{t('inbox.unprocessed.col.actions')}</th>
                    ) : null}
                  </>
                ) : (
                  <>
                    <th className={thCell}>{t('inbox.unprocessed.col.type')}</th>
                    <th className={thCell}>{t('inbox.unprocessed.col.status')}</th>
                    <th className={thCell}>{t('inbox.unprocessed.col.actions')}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isConverting = convertingIndex === row.sourceIndex
                const isRetrying = retryingIndex === row.sourceIndex
                const isDeleting = deletingIndex === row.sourceIndex
                const rowBusy = isConverting || isRetrying || isDeleting
                const deleteButton = onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    disabled={rowBusy}
                    aria-label={t('inbox.unprocessed.actions.delete')}
                    title={t('inbox.unprocessed.actions.delete')}
                    className="inline-flex size-6 items-center justify-center rounded-full border-[0.5px] border-redOne/20 bg-redOne/10 text-redOne transition-colors hover:bg-redOne/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isDeleting ? (
                      <span className="size-3 animate-spin rounded-full border-2 border-redOne border-t-transparent" />
                    ) : (
                      <Trash2 className="size-3" aria-hidden />
                    )}
                  </button>
                ) : null
                return (
                  <tr key={row.id} className="border-b border-bottomBorder">
                    <td className={cn('max-w-[320px] truncate', tdCell)} title={row.fileName}>
                      {row.fileName}
                    </td>
                    {hideActionsColumn ? (
                      <>
                        <td className="px-3 py-3">
                          <span
                            className="rounded-md bg-[#C628281A] px-2 py-1 text-[14px] font-normal leading-[100%] tracking-[0] text-[#C62828]"
                            title={row.statusDetail}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td
                          className={cn('max-w-[140px] truncate', tdCell)}
                          title={documentTypeLabel(row.type)}
                        >
                          {documentTypeLabel(row.type)}
                        </td>
                        {showCompactActions ? <td className="px-3 py-3">{deleteButton}</td> : null}
                      </>
                    ) : (
                      <>
                        <td
                          className={cn('max-w-[140px] truncate', tdCell)}
                          title={documentTypeLabel(row.type)}
                        >
                          {documentTypeLabel(row.type)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="rounded-md bg-[#C628281A] px-2 py-1 text-[14px] font-normal leading-[100%] tracking-[0] text-[#C62828]"
                            title={row.statusDetail}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {/* A caller that doesn't pass onRetry (the import-job view)
                              gets no button at all rather than a dead one. */}
                            {onRetry ? (
                              <button
                                type="button"
                                onClick={() => onRetry(row)}
                                disabled={rowBusy}
                                aria-label={
                                  isRetrying
                                    ? t('inbox.actions.retrying')
                                    : t('inbox.actions.retry')
                                }
                                title={
                                  isRetrying
                                    ? t('inbox.actions.retrying')
                                    : t('inbox.actions.retry')
                                }
                                className="inline-flex size-6 items-center justify-center rounded-full border-[0.5px] border-rp-accent/20 bg-rp-accent/10 text-rp-accent transition-colors hover:bg-rp-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <RefreshCw
                                  className={cn('size-3', isRetrying && 'animate-spin')}
                                  aria-hidden
                                />
                              </button>
                            ) : null}
                            {deleteButton}
                            {!onRetry && !deleteButton ? (
                              <span className="text-blackFive">—</span>
                            ) : null}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
