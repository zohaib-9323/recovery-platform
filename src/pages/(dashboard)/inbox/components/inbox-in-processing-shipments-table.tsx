import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
import type { InboxInProcessingShipmentRow } from '@/pages/(dashboard)/inbox/types'

const thCell =
  'px-3 py-3 text-left text-[13px] font-normal leading-[100%] tracking-[0] text-[#000000]'
const tdCell = 'px-3 py-3 text-[14px] font-normal leading-[100%] tracking-[0] text-[#000000]'

export type InboxInProcessingShipmentsTableProps = {
  rows: InboxInProcessingShipmentRow[]
  className?: string
}

/**
 * Shows manual Create Shipment requests that were submitted but haven't resolved yet.
 * Purely client-side — see `InboxInProcessingShipmentRow` in `types.ts`. Rows here move
 * to Processable Shipments on success or back to Unprocessable Shipments on failure,
 * both handled by `InboxDetailPanel`; this component just renders whatever it's given.
 */
export function InboxInProcessingShipmentsTable({
  rows,
  className,
}: InboxInProcessingShipmentsTableProps) {
  const { t } = useI18n()
  if (rows.length === 0) {
    return <p className="text-base font-light text-blackFive">{t('inbox.inProcessing.empty')}</p>
  }

  return (
    <div className={cn('rounded-lg border border-[#E0E0E0]', className)}>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-[#F8F8F8]">
            <tr>
              <th className={thCell}>{t('inbox.inProcessing.col.title')}</th>
              <th className={thCell}>{t('inbox.inProcessing.col.ci')}</th>
              <th className={thCell}>{t('inbox.inProcessing.col.c88')}</th>
              <th className={thCell}>{t('inbox.inProcessing.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-bottomBorder">
                <td className={cn('max-w-[280px] truncate', tdCell)} title={row.title}>
                  {row.title}
                </td>
                <td className={cn('max-w-[220px] truncate', tdCell)} title={row.ciFileName}>
                  {row.ciFileName}
                </td>
                <td className={cn('max-w-[220px] truncate', tdCell)} title={row.c88FileName}>
                  {row.c88FileName}
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-2 rounded-md bg-lightYellowThree px-2 py-1 text-[14px] font-normal leading-[100%] tracking-[0] text-yellow">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 animate-spin rounded-full border-2 border-yellow border-t-transparent"
                    />
                    {t('inbox.inProcessing.status')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
