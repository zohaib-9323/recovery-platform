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
  /** Overrides the default fixed-height scroll wrapper (`max-h-[360px] overflow-auto`) — pass e.g. `''` for a full-height list that scrolls with its page instead. */
  scrollWrapperClassName?: string
}

export function InboxProcessedShipmentsTable({
  rows,
  onDownloadAttachment,
  onViewShipment,
  isViewDisabled,
  className,
  scrollWrapperClassName = 'max-h-[360px] overflow-auto',
}: InboxProcessedShipmentsTableProps) {
  const { t } = useI18n()
  if (rows.length === 0) {
    return <p className="text-base font-light text-blackFive">{t('inbox.processed.empty')}</p>
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-[#E0E0E0]', className)}>
      <div className={scrollWrapperClassName}>
        <table className="w-full bg-white">
          <thead className="sticky top-0 z-10 bg-greyFour">
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
                      className="ml-auto flex size-6 items-center justify-center rounded-full border border-bottomBorder bg-white transition disabled:opacity-50"
                    >
                      <span className="icon-open-eye text-[12px] text-black transition group-hover:text-yellow" />
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
