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
  className?: string
}

export function InboxUnprocessedShipmentsTable({
  rows,
  onConvertToProcessable,
  convertingIndex = null,
  className,
}: InboxUnprocessedShipmentsTableProps) {
  const { t } = useI18n()
  if (rows.length === 0) {
    return <p className="text-base font-light text-blackFive">{t('inbox.unprocessed.empty')}</p>
  }

  return (
    <div className={cn('rounded-lg border border-[#E0E0E0]', className)}>
      <table className="w-full">
        <thead className="bg-[#F8F8F8]">
          <tr>
            <th className={thCell}>{t('inbox.unprocessed.col.fileName')}</th>
            <th className={thCell}>{t('inbox.unprocessed.col.type')}</th>
            <th className={thCell}>{t('inbox.unprocessed.col.shipmentRef')}</th>
            <th className={thCell}>{t('inbox.unprocessed.col.status')}</th>
            <th className={thCell}>{t('inbox.unprocessed.col.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-bottomBorder">
              <td className={cn('max-w-[320px] truncate', tdCell)} title={row.fileName}>
                {row.fileName}
              </td>
              <td className={cn('max-w-[140px] truncate', tdCell)} title={row.type}>
                {row.type}
              </td>
              <td className={cn('max-w-[240px] truncate', tdCell)} title={row.shipmentRef}>
                {row.shipmentRef}
              </td>
              <td className="px-3 py-3">
                <span className="rounded-md bg-[#C628281A] px-2 py-1 text-[14px] font-normal leading-[100%] tracking-[0] text-[#C62828]">
                  {row.status}
                </span>
              </td>
              <td className="px-3 py-3">
                <InboxRowActionMenu
                  disabled={convertingIndex === row.sourceIndex}
                  optionLabel={
                    convertingIndex === row.sourceIndex
                      ? t('inbox.actions.converting')
                      : t('inbox.actions.convertToProcessable')
                  }
                  optionTextClassName="text-green"
                  onSelect={() => onConvertToProcessable?.(row.sourceIndex)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
