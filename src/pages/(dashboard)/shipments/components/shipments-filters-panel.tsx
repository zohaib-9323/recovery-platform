import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

export type ShipmentFiltersValue = {
  messageId: string
  shipmentKey: string
  status: string
  dateFrom: string
  dateTo: string
  flaggedItem: '' | 'true'
  refundStatus: string
}

type ShipmentsFiltersPanelProps = {
  value: ShipmentFiltersValue
  onChange: (next: ShipmentFiltersValue) => void
  onApply: () => void
  onReset: () => void
  className?: string
}

const inputClassName =
  'h-10 w-full rounded-md border border-bottomBorder bg-white px-3 text-sm text-black outline-none focus:ring-2 focus:ring-yellow/35'

export function ShipmentsFiltersPanel({
  value,
  onChange,
  onApply,
  onReset,
  className,
}: ShipmentsFiltersPanelProps) {
  const { t } = useI18n()

  const setField = <K extends keyof ShipmentFiltersValue>(
    key: K,
    nextValue: ShipmentFiltersValue[K],
  ) => onChange({ ...value, [key]: nextValue })

  return (
    <div className={cn('rounded-lg border border-bottomBorder bg-white p-4', className)}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <input
          value={value.messageId}
          onChange={(e) => setField('messageId', e.target.value)}
          placeholder={t('shipments.filters.messageId')}
          className={inputClassName}
        />
        <input
          value={value.shipmentKey}
          onChange={(e) => setField('shipmentKey', e.target.value)}
          placeholder={t('shipments.filters.shipmentKey')}
          className={inputClassName}
        />
        <select
          value={value.status}
          onChange={(e) => setField('status', e.target.value)}
          className={inputClassName}
        >
          <option value="">{t('shipments.filters.statusAll')}</option>
          <option value="1">{t('shipments.filters.statusSubmitted')}</option>
          <option value="2">{t('shipments.filters.statusInReview')}</option>
          <option value="3">{t('shipments.filters.statusApproved')}</option>
          <option value="4">{t('shipments.filters.statusRejected')}</option>
        </select>
        <select
          value={value.refundStatus}
          onChange={(e) => setField('refundStatus', e.target.value)}
          className={inputClassName}
        >
          <option value="">{t('shipments.filters.refundAll')}</option>
          <option value="0">{t('shipments.filters.refundNotRequested')}</option>
          <option value="1">{t('shipments.filters.refundRequested')}</option>
          <option value="2">{t('shipments.filters.refundProcessing')}</option>
          <option value="3">{t('shipments.filters.refundRefunded')}</option>
        </select>
        <input
          type="date"
          value={value.dateFrom}
          onChange={(e) => setField('dateFrom', e.target.value)}
          className={inputClassName}
        />
        <input
          type="date"
          value={value.dateTo}
          onChange={(e) => setField('dateTo', e.target.value)}
          className={inputClassName}
        />
        <select
          value={value.flaggedItem}
          onChange={(e) => setField('flaggedItem', e.target.value as '' | 'true')}
          className={inputClassName}
        >
          <option value="">{t('shipments.filters.flaggedAll')}</option>
          <option value="true">{t('shipments.filters.flaggedOnly')}</option>
        </select>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          className="h-9 rounded-md border border-bottomBorder px-3 text-sm font-light text-black"
        >
          {t('shipments.toolbar.resetFilters')}
        </button>
        <button
          type="button"
          onClick={onApply}
          className="h-9 rounded-md bg-yellow px-3 text-sm font-medium text-white hover:bg-yellow/90"
        >
          {t('shipments.filters.apply')}
        </button>
      </div>
    </div>
  )
}
