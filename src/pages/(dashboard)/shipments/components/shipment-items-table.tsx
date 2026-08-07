import { Tooltip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/useI18n'
import { formatCurrency } from '@/lib/format-currency'
import { getCurrencySymbol } from '@/lib/format-shipment-list-date'
import { MS } from '@/lib/manage-shipments-copy'
import type { RecoveryShipmentItem } from '@/types/recovery-shipments-api'

function isItemFlagged(item: RecoveryShipmentItem): boolean {
  return Boolean(item.flagged || item.isFlagged || item.is_flagged === 1)
}

export type ShipmentItemsTableProps = {
  items: RecoveryShipmentItem[]
  itemsUnit?: string
  shipmentStatus?: number
  onChallenge?: (item: RecoveryShipmentItem) => void
  disableChallenge?: boolean
  onViewPreferentialDuty?: (item: RecoveryShipmentItem) => void
}

export function ShipmentItemsTable({
  items,
  itemsUnit,
  shipmentStatus,
  onChallenge,
  disableChallenge = false,
  onViewPreferentialDuty,
}: ShipmentItemsTableProps) {
  const { t } = useI18n()

  if (shipmentStatus === 1) {
    return null
  }

  if (items.length === 0) {
    return (
      <div className="flex w-full items-center justify-center border-borderLineColor p-4">
        <div className="flex flex-col items-center gap-2">
          <img src="/images/emptybox.svg" width={50} height={50} alt="" />
          <p className="text-center text-xs font-light text-black sm:text-sm">
            {t('shipments.detail.noShipmentItemsForFilter')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div id="shipment-items" className="w-full overflow-hidden">
      <div className="no-scrollbar w-full overflow-x-auto">
        <table
          className={`w-[300%] overflow-x-scroll bg-white sm:w-[250%] md:w-[200%] lg:w-[150%] ipadLarge:w-full ${
            items.length > 0 ? 'border-b border-bottomBorder' : ''
          }`}
        >
          <thead className="text-nowrap border-b border-bottomBorder bg-greyFour">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-black md:text-sm">
                {MS.item}
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-black md:text-sm">
                {MS.description}
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-black md:text-sm">
                {MS.hsCode}
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-black md:text-sm">
                {MS.unitPrice}
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-black md:text-sm">
                {MS.qty}
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-black md:text-sm">
                {MS.total}
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-black md:text-sm">
                {MS.duty}
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-black md:text-sm">
                {MS.landedCost}
              </th>
              <th
                data-pdf-exclude
                className="px-4 py-2 text-center text-xs font-semibold text-black sm:text-left md:text-sm"
              >
                {MS.action}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id || item._id || `${index}`}
                className={
                  isItemFlagged(item)
                    ? 'bg-lightRedOne'
                    : index % 2 === 0
                      ? 'bg-lightYellowSix'
                      : 'bg-white'
                }
              >
                <td className="px-4 py-2 text-xs font-medium text-black md:text-sm">
                  <div className="flex flex-row items-center gap-1">
                    {item.itemNumber}
                    {isItemFlagged(item) ? (
                      <Tooltip
                        content={MS.flaggedContent}
                        heading={MS.flaggedHeading}
                        position="bottom"
                      >
                        <span id="flagged-item" className="icon-flag text-redOne" />
                      </Tooltip>
                    ) : null}
                  </div>
                </td>
                <td
                  className="max-w-32 truncate px-4 py-2 text-xs font-normal capitalize text-black md:max-w-80 md:text-sm"
                  title={item.description || undefined}
                >
                  {item.description}
                </td>
                <td
                  id="hs-code-reference"
                  className="px-4 py-2 text-xs font-normal text-black md:text-sm"
                >
                  <div className="flex flex-row items-center gap-2">
                    {item.challengeData?.proposedHsCode ? (
                      <Tooltip
                        content={t('shipments.detail.hsCodeUnderReviewTooltip', {
                          proposedHsCode: item.challengeData.proposedHsCode,
                        })}
                        heading={t('shipments.detail.hsCodeUnderReview')}
                        position="bottom"
                      >
                        <span
                          id="hs-code-requires-approval"
                          className="icon-alert-triangle-2 text-yellow"
                        />
                      </Tooltip>
                    ) : null}
                    {item.hsCode}
                  </div>
                </td>
                <td className="px-4 py-2 text-xs font-normal text-black md:text-sm">
                  {getCurrencySymbol(itemsUnit)}
                  {formatCurrency(item.unitPrice ?? 0)}
                </td>
                <td className="px-4 py-2 text-xs font-normal text-black md:text-sm">{item.qty}</td>
                <td className="px-4 py-2 text-xs font-normal text-black md:text-sm">
                  {getCurrencySymbol(itemsUnit)}
                  {formatCurrency(item.Total ?? item.totalPrice ?? 0)}
                </td>
                <td className="px-4 py-2 text-xs font-normal text-black md:text-sm">
                  {getCurrencySymbol(itemsUnit)}
                  {formatCurrency(item.duty ?? 0)}
                </td>
                <td className="px-4 py-2 text-left text-xs font-normal text-black md:text-sm">
                  {getCurrencySymbol(itemsUnit)}
                  {formatCurrency(item.landedCost ?? 0)}
                </td>
                <td data-pdf-exclude className="px-4 py-2 text-center sm:text-left">
                  <div className="flex flex-col items-center gap-1 sm:items-start">
                    {onChallenge ? (
                      <button
                        type="button"
                        onClick={() => onChallenge(item)}
                        disabled={disableChallenge || Boolean(item.is_challenged)}
                        className="whitespace-nowrap text-xs font-medium text-primary disabled:cursor-not-allowed disabled:text-greySix"
                      >
                        {item.is_challenged
                          ? t('shipments.detail.challenged')
                          : t('shipments.detail.challengeHsCode')}
                      </button>
                    ) : null}
                    {onViewPreferentialDuty ? (
                      <button
                        type="button"
                        onClick={() => onViewPreferentialDuty(item)}
                        disabled={!item.hsCode}
                        className="whitespace-nowrap text-xs font-medium text-primary disabled:cursor-not-allowed disabled:text-greySix"
                      >
                        {t('shipments.detail.preferentialDuty')}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
