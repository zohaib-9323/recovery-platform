import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
import type { InboxAttachment, InboxShipmentRow } from '@/pages/(dashboard)/inbox/types'
import { InboxRowActionMenu } from './inbox-row-action-menu'

const thCell =
  'px-3 py-3 text-left text-[13px] font-normal leading-[100%] tracking-[0] text-[#000000]'
const tdCell = 'px-3 py-3 text-[14px] font-normal leading-[100%] tracking-[0] text-[#000000]'

export type InboxProcessedShipmentsTableProps = {
  rows: InboxShipmentRow[]
  onConvertToUnprocessed?: (processableIndex: number) => Promise<void> | void
  onDownloadAttachment?: (attachment: InboxAttachment) => Promise<void> | void
  convertingIndex?: number | null
  className?: string
}

export function InboxProcessedShipmentsTable({
  rows,
  onConvertToUnprocessed,
  onDownloadAttachment,
  convertingIndex = null,
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
              <th className={thCell}>{t('inbox.processed.col.actions')}</th>
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
                <td className="px-3 py-3">
                  <InboxRowActionMenu
                    disabled={convertingIndex === row.sourceIndex}
                    options={[
                      {
                        label:
                          convertingIndex === row.sourceIndex
                            ? t('inbox.actions.converting')
                            : t('inbox.actions.convertToUnprocessed'),
                        textClassName: 'text-redOne',
                        onSelect: () => onConvertToUnprocessed?.(row.sourceIndex),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
