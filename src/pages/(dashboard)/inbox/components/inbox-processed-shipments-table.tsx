import { Eye } from 'lucide-react'

import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
import type { InboxAttachment, InboxShipmentRow } from '@/pages/(dashboard)/inbox/types'

const thCell =
  'px-3 py-3 text-left text-[13px] font-normal leading-[100%] tracking-[0] text-[#000000]'
const tdCell = 'px-3 py-3 text-[14px] font-normal leading-[100%] tracking-[0] text-[#000000]'

export type InboxProcessedShipmentsTableProps = {
  rows: InboxShipmentRow[]
  onConvertToUnprocessed?: (processableIndex: number) => Promise<void> | void
  onDownloadAttachment?: (attachment: InboxAttachment) => Promise<void> | void
  convertingIndex?: number | null
  /**
   * Opens the shipment a row became. The Actions column renders ONLY when this
   * is passed — same rule as `onRetry` on the unprocessed table, so callers with
   * nowhere to navigate (the Inbox, the import-job detail panel) get no column
   * rather than a column of dead buttons.
   */
  onViewShipment?: (row: InboxShipmentRow) => void
  /** Rows with no shipment yet: shown, but their action is disabled. */
  isViewDisabled?: (row: InboxShipmentRow) => boolean
  className?: string
}

export function InboxProcessedShipmentsTable({
  rows,
  onDownloadAttachment,
  onViewShipment,
  isViewDisabled,
  className,
}: InboxProcessedShipmentsTableProps) {
  const { t } = useI18n()
  if (rows.length === 0) {
    return <p className="text-base font-light text-blackFive">{t('inbox.processed.empty')}</p>
  }

  return (
    <div className={cn('rounded-lg border border-[#E0E0E0]', className)}>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-[#F8F8F8]">
            <tr>
              <th className={thCell}>{t('inbox.processed.col.title')}</th>
              <th className={thCell}>{t('inbox.processed.col.date')}</th>
              <th className={thCell}>{t('inbox.processed.col.c88')}</th>
              <th className={thCell}>{t('inbox.processed.col.po')}</th>
              {onViewShipment ? (
                <th className={cn(thCell, 'text-right')}>{t('inbox.processed.col.actions')}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-bottomBorder">
                <td className={cn('max-w-[280px] truncate', tdCell)} title={row.title}>
                  {row.title}
                </td>
                <td className={tdCell}>{row.date}</td>
                <td className={cn('max-w-[220px] truncate', tdCell)} title={row.c88?.name}>
                  {row.c88 ? (
                    <button
                      type="button"
                      className="max-w-full truncate text-left text-[#0B57D0] underline"
                      onClick={() => onDownloadAttachment?.(row.c88!)}
                    >
                      {row.c88.name}
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
                <td className={cn('max-w-[220px] truncate', tdCell)} title={row.po?.name}>
                  {row.po ? (
                    <button
                      type="button"
                      className="max-w-full truncate text-left text-[#0B57D0] underline"
                      onClick={() => onDownloadAttachment?.(row.po!)}
                    >
                      {row.po.name}
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
                {onViewShipment ? (
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onViewShipment(row)}
                      disabled={isViewDisabled?.(row) ?? false}
                      aria-label={t('inbox.processed.view')}
                      title={t('inbox.processed.view')}
                      className="inline-flex size-8 items-center justify-center rounded-md text-rp-fg transition-colors hover:bg-[var(--hover-color)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Eye className="size-4" aria-hidden />
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
