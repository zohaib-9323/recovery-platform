import { useEffect, useRef, useState } from 'react'
import { CSVLink } from 'react-csv'

import { PrimaryButton } from '@/components/buttons/preset/primary-button'
import { Tooltip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/useI18n'
import { formatCurrency } from '@/lib/format-currency'
import { getCurrencySymbol } from '@/lib/format-shipment-list-date'
import { MS } from '@/lib/manage-shipments-copy'
import type { RecoveryShipmentItem } from '@/types/recovery-shipments-api'

import { LandedCostReason } from './landed-cost-reason'

type LandedCostPair = [RecoveryShipmentItem, RecoveryShipmentItem]

export type LandedCostComparisonContent = {
  landed_cost?: LandedCostPair[]
  unit?: string
  c88unit?: string
  status?: number | string
  total_estimated_landed_cost?: number
  total_actual_landed_cost?: number
}

type EstimatedValueCardProps = {
  heading: string
  data: RecoveryShipmentItem[]
  isEmptyList: boolean
  emptyCaseMessage: string
  isItemFlagged: boolean
  unit: string
  costDifference?: number
  showDifference?: boolean
}

function EstimatedValueCard({
  heading,
  data = [],
  isEmptyList,
  emptyCaseMessage,
  isItemFlagged,
  unit,
  costDifference,
  showDifference,
}: EstimatedValueCardProps) {
  return (
    <div className="w-full border border-bottomBorder bg-greyFour">
      {isEmptyList ? (
        <div className="flex h-40 flex-col items-center justify-center bg-lightRedOne">
          <span className="icon-alert-triangle mb-2 text-4xl text-redOne" />
          <p className="max-w-xs text-center text-xs text-redOne lg:max-w-lg lg:text-sm">
            {emptyCaseMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="flex w-full items-center justify-center p-3">
            <p className="p-2 text-xl font-semibold text-black">{heading}</p>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-[150%] overflow-x-scroll smallScreen:w-full">
              <thead>
                <tr className="border border-bottomBorder bg-greyFour">
                  <th className="text-nowrap px-4 py-4 text-left text-xs font-semibold text-black">
                    {MS.quantity}
                  </th>
                  <th className="text-nowrap px-4 py-4 text-left text-xs font-semibold text-black">
                    {MS.unitPrice}
                  </th>
                  <th className="text-nowrap px-4 py-4 text-left text-xs font-semibold text-black">
                    {MS.dutyAmount}
                  </th>
                  <th className="text-nowrap px-4 py-4 text-left text-xs font-semibold text-black">
                    {MS.totalLandedCost}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item._id || item.id || item.itemNumber}
                    className={`${isItemFlagged ? 'bg-lightRedOne' : 'bg-lightYellowSix'} h-full`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-black">{item?.qty}</td>
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      {getCurrencySymbol(unit)}
                      {formatCurrency(item?.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      {getCurrencySymbol(unit)}
                      {formatCurrency(item?.duty)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      <div className="flex flex-row items-center gap-2">
                        {getCurrencySymbol(unit)}
                        {formatCurrency(item?.landedCost)}
                        {showDifference && (item as { source?: string }).source === 'items' ? (
                          <Tooltip
                            content={`Difference: ${(Number(costDifference) || 0).toFixed(2)} (Actual - Estimated)`}
                            heading="Landed Cost Difference"
                            position="left"
                            width="w-52 sm:w-64"
                          >
                            <div
                              id="landed-cost-difference"
                              className="ml-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow p-1 shadow-[inset_0_0_3px_1px_rgba(0,0,0,0.15)]"
                            >
                              <span className="icon-confirmation text-xxxtiny text-white" />
                            </div>
                          </Tooltip>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function generatePairCsv(
  item: RecoveryShipmentItem,
  c88Item: RecoveryShipmentItem,
  comparison: LandedCostComparisonContent,
) {
  const selectedData: Record<string, unknown>[] = []
  const csvRow: Record<string, unknown> = {
    Section: 'Estimated Value',
    'Item Number': item?.itemNumber || 'N/A',
    Description: item?.description || 'N/A',
    'HS Code': item?.hsCode || 'N/A',
    Quantity: item?.qty || 'N/A',
    Unit: comparison?.unit || 'N/A',
    'Unit Price': item?.unitPrice ?? 0,
    'Total Price': (item as { Total?: number }).Total ?? item?.totalPrice ?? 0,
    Duty: item?.duty ?? 0,
    'Landed Cost': item?.landedCost ?? 0,
    'Shipment ID': (item as { shipment?: string }).shipment || 'N/A',
    'Is Flagged': (item as { is_flagged?: number }).is_flagged ? 'Yes' : 'No',
  }
  if ((item as { reason?: string }).reason) {
    csvRow['Flag Reason'] = (item as { reason?: string }).reason
  } else if ((item as { item_reason?: string }).item_reason) {
    csvRow['item Reason'] = (item as { item_reason?: string }).item_reason
  } else {
    csvRow['Flag Reason'] = 'N/A'
  }
  selectedData.push(csvRow)
  selectedData.push({})
  selectedData.push({
    Section: 'Actual Value',
    'Item Number': item?.itemNumber || 'N/A',
    Description: c88Item?.description || 'N/A',
    'HS Code': c88Item?.hsCode || 'N/A',
    Quantity: c88Item?.qty ?? 'N/A',
    Unit: comparison?.c88unit || 'N/A',
    'Unit Price': c88Item?.unitPrice ?? 'N/A',
    'Total Price': c88Item?.totalPrice ?? 'N/A',
    Duty: c88Item?.duty ?? 'N/A',
    'Landed Cost': c88Item?.landedCost ?? 'N/A',
    'Shipment ID': (c88Item as { shipment_id?: string }).shipment_id || 'N/A',
  })
  selectedData.push({})
  return selectedData
}

export type LandedCostComparisonModalProps = {
  content: LandedCostComparisonContent | null
  isLoading?: boolean
  onClose: () => void
}

export function LandedCostComparisonModal({
  content,
  isLoading = false,
  onClose,
}: LandedCostComparisonModalProps) {
  const { t } = useI18n()
  const csvLinkRef = useRef<CSVLink & HTMLAnchorElement & { link?: HTMLAnchorElement }>(null)
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([])

  const itemsComparisonsList = content?.landed_cost ?? []

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleDownloadPair = (item: RecoveryShipmentItem, c88Item: RecoveryShipmentItem) => {
    setCsvData(generatePairCsv(item, c88Item, content ?? {}))
    setTimeout(() => {
      csvLinkRef.current?.link?.click()
    }, 100)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm">
      <div className="flex h-screen w-full items-center justify-center p-3">
        <div
          className="max-h-[200vh] w-fit overflow-hidden rounded-3xl bg-white p-5"
          id="landed-cost-comparison"
        >
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center justify-between">
              <p className="text-base font-bold text-black sm:text-xl">{MS.landedCostComparison}</p>
              <button type="button" onClick={onClose} aria-label={MS.close}>
                <span className="icon-close cursor-pointer text-base text-black sm:text-large" />
              </button>
            </div>
            <p className="text-xs font-normal text-lightBlackOne sm:text-sm">
              {MS.landedCostComparisonDesc}
            </p>
          </div>

          {isLoading ? (
            <div className="mt-2 flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow border-t-transparent" />
            </div>
          ) : (
            <div className="no-scrollbar mt-6 max-h-[45vh] overflow-y-auto sm:mt-2">
              {itemsComparisonsList.map((pair, index) => {
                const [item, c88Item] = pair
                const costDifference =
                  Number(c88Item?.landedCost ?? 0) - Number(item?.landedCost ?? 0)
                const isItemEmpty = !item || Object.keys(item).length === 0
                const isC88ItemEmpty = !c88Item || Object.keys(c88Item).length === 0
                const isItemFlagged =
                  !isItemEmpty &&
                  !isC88ItemEmpty &&
                  (item as { is_flagged?: number }).is_flagged === 1

                if (isItemEmpty && isC88ItemEmpty) {
                  return (
                    <div key={index} className="mt-5 w-full text-center text-gray-500">
                      {t('shipments.landedCost.empty')}
                    </div>
                  )
                }

                const reason =
                  (item as { reason?: string }).reason ||
                  (item as { item_reason?: string }).item_reason ||
                  ''

                return (
                  <div key={item?._id || String(index)} className="mt-5 flex w-full flex-col gap-3">
                    <div>
                      <div className="flex items-center">
                        <p className="text-xl font-semibold text-black">
                          {item?.itemNumber ? `${MS.item} ${item.itemNumber}` : 'Unknown Item'}
                        </p>
                        {!item?.itemNumber ? (
                          <Tooltip
                            content="Item does not exist in Purchase Order."
                            heading="Unknown Item"
                            position="bottom"
                            width="w-80"
                          >
                            <div className="ml-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow p-1 shadow-[inset_0_0_3px_1px_rgba(0,0,0,0.15)]">
                              <span className="icon-confirmation text-xxxtiny text-white" />
                            </div>
                          </Tooltip>
                        ) : null}
                      </div>
                      <p className="text-base text-black">
                        <span className="font-semibold">
                          {t('shipments.landedCost.hsCodeLabel')}{' '}
                        </span>
                        {item?.hsCode || c88Item?.hsCode}
                      </p>
                      <p className="text-base text-black">
                        <span className="font-semibold">
                          {t('shipments.landedCost.descriptionLabel')}{' '}
                        </span>
                        {item?.description || c88Item?.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-center md:flex-row md:items-start">
                      <EstimatedValueCard
                        heading={MS.estimatedValue}
                        data={isItemEmpty ? [] : [item]}
                        isEmptyList={isItemEmpty}
                        emptyCaseMessage={MS.estimatedValueCardMessage}
                        isItemFlagged={isItemFlagged}
                        costDifference={costDifference}
                        showDifference={content?.status === 9}
                        unit={content?.unit ?? ''}
                      />
                      <div className="flex h-14 w-36 items-center justify-center bg-yellow">
                        <span className="icon-arrows text-h5 text-white" />
                      </div>
                      <EstimatedValueCard
                        heading={MS.actualPaid}
                        data={isC88ItemEmpty ? [] : [c88Item]}
                        isEmptyList={isC88ItemEmpty}
                        emptyCaseMessage={MS.actualValueCardMessage}
                        isItemFlagged={isItemFlagged}
                        unit={content?.c88unit ?? ''}
                      />
                    </div>

                    {!isItemEmpty && reason ? (
                      <div id="reason-for-discrepancy" className="flex flex-col gap-2">
                        <p className="text-lg font-bold text-black">{MS.reason}</p>
                        <div className="max-w-5xl">
                          <LandedCostReason
                            isFlagged={Boolean((item as { is_flagged?: number }).is_flagged)}
                            reason={
                              (item as { is_flagged?: number }).is_flagged
                                ? reason
                                : (item as { item_reason?: string }).item_reason || reason
                            }
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="-mt-5 flex w-full items-center justify-end">
                      <PrimaryButton
                        type="button"
                        onClick={() => handleDownloadPair(item, c88Item)}
                        className="bg-yellow px-4 py-2 text-xs font-light text-white md:text-sm"
                      >
                        {MS.downloadReport}
                      </PrimaryButton>
                      <CSVLink
                        data={csvData}
                        filename={`landed-cost-comparison-${
                          (itemsComparisonsList?.[0]?.[0] as { shipment?: string })?.shipment ||
                          itemsComparisonsList?.[0]?.[0]?.itemNumber ||
                          new Date().toISOString().split('T')[0]
                        }.csv`}
                        className="hidden"
                        ref={csvLinkRef}
                        target="_blank"
                      >
                        {t('shipments.landedCost.export')}
                      </CSVLink>
                    </div>
                  </div>
                )
              })}
              {!itemsComparisonsList.length ? (
                <div className="mt-5 text-center text-sm text-lightBlackOne">
                  {t('shipments.landedCost.noData')}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
