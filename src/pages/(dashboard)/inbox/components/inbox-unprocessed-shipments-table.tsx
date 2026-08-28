import { RefreshCw } from 'lucide-react'

import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
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
   * Drops the Actions column and shows File Name / Status / Type instead of
   * the default File Name / Type / Status / Actions. Used by the cross-import
   * Unprocessed Documents view, whose Actions column has no retry endpoint to
   * call for cross-import rows.
   */
  hideActionsColumn?: boolean
}

export function InboxUnprocessedShipmentsTable({
  rows,
  convertingIndex = null,
  onRetry,
  retryingIndex = null,
  className,
  scrollWrapperClassName = 'max-h-[360px] overflow-auto',
  hideActionsColumn = false,
}: InboxUnprocessedShipmentsTableProps) {
  const { t } = useI18n()
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
                const rowBusy = isConverting || isRetrying
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
                        <td className={cn('max-w-[140px] truncate', tdCell)} title={row.type}>
                          {row.type}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={cn('max-w-[140px] truncate', tdCell)} title={row.type}>
                          {row.type}
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
                          {/* A caller that doesn't pass onRetry (the import-job view)
                              gets no button at all rather than a dead one. */}
                          {onRetry ? (
                            <button
                              type="button"
                              onClick={() => onRetry(row)}
                              disabled={rowBusy}
                              aria-label={
                                isRetrying ? t('inbox.actions.retrying') : t('inbox.actions.retry')
                              }
                              title={
                                isRetrying ? t('inbox.actions.retrying') : t('inbox.actions.retry')
                              }
                              className="inline-flex size-6 items-center justify-center rounded-full border-[0.5px] border-rp-accent/20 bg-rp-accent/10 text-rp-accent transition-colors hover:bg-rp-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <RefreshCw
                                className={cn('size-3', isRetrying && 'animate-spin')}
                                aria-hidden
                              />
                            </button>
                          ) : (
                            <span className="text-blackFive">—</span>
                          )}
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
