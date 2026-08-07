import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'
import { InboxRowActionMenu } from './inbox-row-action-menu'

const thCell =
  'px-3 py-3 text-left text-[13px] font-normal leading-[100%] tracking-[0] text-[#000000]'
const tdCell = 'px-3 py-3 text-[14px] font-normal leading-[100%] tracking-[0] text-[#000000]'

export type InboxUnprocessedShipmentsTableProps = {
  rows: InboxUnprocessedShipmentRow[]
  onConvertToProcessable?: (unprocessableIndex: number) => Promise<void> | void
  convertingIndex?: number | null
  onRetry?: (row: InboxUnprocessedShipmentRow) => Promise<void> | void
  retryingIndex?: number | null
  onRetryAll?: () => Promise<void> | void
  isRetryingAll?: boolean
  className?: string
}

export function InboxUnprocessedShipmentsTable({
  rows,
  onConvertToProcessable,
  convertingIndex = null,
  onRetry,
  retryingIndex = null,
  onRetryAll,
  isRetryingAll = false,
  className,
}: InboxUnprocessedShipmentsTableProps) {
  const { t } = useI18n()
  if (rows.length === 0) {
    return <p className="text-base font-light text-blackFive">{t('inbox.unprocessed.empty')}</p>
  }

  return (
    <div className={cn('space-y-2', className)}>
      {onRetryAll ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onRetryAll()}
            disabled={isRetryingAll || retryingIndex !== null}
            className="rounded-md border border-[#E0E0E0] bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-[#F8F8F8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRetryingAll ? t('inbox.actions.retryingAll') : t('inbox.actions.retryAll')}
          </button>
        </div>
      ) : null}
      <div className="rounded-lg border border-[#E0E0E0]">
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-[#F8F8F8]">
              <tr>
                <th className={thCell}>{t('inbox.unprocessed.col.fileName')}</th>
                <th className={thCell}>{t('inbox.unprocessed.col.type')}</th>
                <th className={thCell}>{t('inbox.unprocessed.col.status')}</th>
                <th className={thCell}>{t('inbox.unprocessed.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isConverting = convertingIndex === row.sourceIndex
                const isRetrying = retryingIndex === row.sourceIndex
                const rowBusy = isConverting || isRetrying || isRetryingAll
                return (
                  <tr key={row.id} className="border-b border-bottomBorder">
                    <td className={cn('max-w-[320px] truncate', tdCell)} title={row.fileName}>
                      {row.fileName}
                    </td>
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
                      <InboxRowActionMenu
                        disabled={rowBusy}
                        options={[
                          {
                            label: isRetrying
                              ? t('inbox.actions.retrying')
                              : t('inbox.actions.retry'),
                            textClassName: 'text-black',
                            onSelect: () => onRetry?.(row),
                          },
                          {
                            label: isConverting
                              ? t('inbox.actions.converting')
                              : t('inbox.actions.convertToProcessable'),
                            textClassName: 'text-green',
                            onSelect: () => onConvertToProcessable?.(row.sourceIndex),
                          },
                        ]}
                      />
                    </td>
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
