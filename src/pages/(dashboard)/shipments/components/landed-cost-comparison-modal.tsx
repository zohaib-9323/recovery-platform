import { downloadTextFile } from '@/lib/csv'
import { useI18n } from '@/i18n/useI18n'
import type { RecoveryShipmentItem } from '@/types/recovery-shipments-api'

type LandedCostComparisonModalProps = {
  poItem?: RecoveryShipmentItem
  c88Item?: RecoveryShipmentItem
  estimatedTotal: number
  actualTotal: number
  currencySymbol: string
  reportFileName: string
  reportContent: string
  onClose: () => void
  formatMoney: (value: unknown, currencySymbol?: string) => string
}

export function LandedCostComparisonModal({
  poItem,
  c88Item,
  estimatedTotal,
  actualTotal,
  currencySymbol,
  reportFileName,
  reportContent,
  onClose,
  formatMoney,
}: LandedCostComparisonModalProps) {
  const { t } = useI18n()
  const comparisonReason =
    Math.abs(estimatedTotal - actualTotal) < 0.01
      ? t('shipments.detail.reason.match')
      : t('shipments.detail.reason.diff')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-5xl rounded-3xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-2xl font-semibold text-black">
              {t('shipments.detail.landedCostTitle')}
            </p>
            <p className="text-sm text-lightBlackOne">{t('shipments.detail.landedCostSubtitle')}</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-black">
            ×
          </button>
        </div>

        <div className="mb-4 text-sm font-semibold text-black">
          <p>
            {t('shipments.detail.itemPrefix', {
              itemNumber: poItem?.itemNumber || c88Item?.itemNumber || '1',
            })}
          </p>
          <p>
            {t('shipments.detail.hsCodePrefix', {
              hsCode: poItem?.hsCode || c88Item?.hsCode || '-',
            })}
          </p>
          <p className="truncate">
            {t('shipments.detail.descriptionPrefix', {
              description: poItem?.description || c88Item?.description || '-',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <div className="overflow-hidden rounded-md border border-bottomBorder">
            <div className="bg-greyFour p-3 text-center text-2xl font-semibold text-black">
              {t('shipments.detail.estimatedValue')}
            </div>
            <div className="grid grid-cols-4 border-t border-bottomBorder bg-white text-xs font-semibold text-black">
              <p className="p-3">{t('shipments.detail.col.quantity')}</p>
              <p className="p-3">{t('shipments.detail.col.unitPrice')}</p>
              <p className="p-3">{t('shipments.detail.col.dutyAmount')}</p>
              <p className="p-3">{t('shipments.detail.col.totalLandedCost')}</p>
            </div>
            <div className="grid grid-cols-4 bg-[#F6F2EC] text-sm font-semibold text-black">
              <p className="p-3">{poItem?.qty ?? '-'}</p>
              <p className="p-3">{formatMoney(poItem?.unitPrice, currencySymbol)}</p>
              <p className="p-3">{formatMoney(poItem?.duty, currencySymbol)}</p>
              <p className="p-3">{formatMoney(estimatedTotal, currencySymbol)}</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-12 w-14 items-center justify-center bg-yellow text-4xl text-white">
              ↔
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-bottomBorder">
            <div className="bg-greyFour p-3 text-center text-2xl font-semibold text-black">
              {t('shipments.detail.actualPaid')}
            </div>
            <div className="grid grid-cols-4 border-t border-bottomBorder bg-white text-xs font-semibold text-black">
              <p className="p-3">{t('shipments.detail.col.quantity')}</p>
              <p className="p-3">{t('shipments.detail.col.unitPrice')}</p>
              <p className="p-3">{t('shipments.detail.col.dutyAmount')}</p>
              <p className="p-3">{t('shipments.detail.col.totalLandedCost')}</p>
            </div>
            <div className="grid grid-cols-4 bg-[#F6F2EC] text-sm font-semibold text-black">
              <p className="p-3">{c88Item?.qty ?? '-'}</p>
              <p className="p-3">{formatMoney(c88Item?.unitPrice, currencySymbol)}</p>
              <p className="p-3">{formatMoney(c88Item?.duty, currencySymbol)}</p>
              <p className="p-3">{formatMoney(actualTotal, currencySymbol)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-semibold text-black">{t('shipments.detail.reason')}</p>
          <p
            className={`text-lg ${Math.abs(estimatedTotal - actualTotal) < 0.01 ? 'text-green' : 'text-redOne'}`}
          >
            {comparisonReason}
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => downloadTextFile(reportContent, reportFileName)}
            className="rounded-xl bg-yellow px-6 py-2 text-sm font-medium text-white"
          >
            {t('shipments.detail.downloadReport')}
          </button>
        </div>
      </div>
    </div>
  )
}
