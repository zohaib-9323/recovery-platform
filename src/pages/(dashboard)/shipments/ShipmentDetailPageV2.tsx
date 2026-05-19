/* eslint-disable max-lines */
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  useGetRecoveryShipmentByIdQuery,
  useLazyGetRecoveryShipmentLandedCostQuery,
} from '@/app/services/recoveryApi'
import { CsvExportButton, PrimaryButton } from '@/components/buttons'
import { DropdownField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { downloadTextFile } from '@/lib/csv'
import { DetailsGridCard } from '@/pages/(dashboard)/shipments/components/details-grid-card'
import { LandedCostComparisonModal } from '@/pages/(dashboard)/shipments/components/landed-cost-comparison-modal'
import type {
  RecoveryShipmentDetail,
  RecoveryShipmentItem,
  RecoveryShipmentLandedCostContent,
} from '@/types/recovery-shipments-api'
import { mapRecoveryStatusToLegacy } from '@/lib/recovery-shipment-status-map'
import { getShipmentStatusBadgeClassName } from '@/lib/shipment-status-badge'

type ItemFilter = 'all' | 'flagged' | 'unflagged'

function formatDate(value?: string): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function getItemDutyAmount(item: RecoveryShipmentItem): number {
  const duty = toOptionalNumber(item.duty)
  if (duty !== undefined) return duty

  const dutyAmount = toOptionalNumber(item.dutyAmount)
  if (dutyAmount !== undefined) return dutyAmount

  const rate = toOptionalNumber(item.dutyRate)
  if (rate !== undefined) {
    const base = toOptionalNumber(item.totalPrice) ?? toNumber(item.qty) * toNumber(item.unitPrice)
    return (base * rate) / 100
  }

  return 0
}

function getItemLandedCostAmount(item: RecoveryShipmentItem): number {
  const landed = toOptionalNumber(item.landedCost)
  if (landed !== undefined) return landed

  const total = toOptionalNumber(item.totalPrice) ?? toNumber(item.qty) * toNumber(item.unitPrice)
  return total + getItemDutyAmount(item)
}

function normalizeShipmentItem(item: RecoveryShipmentItem, index: number): RecoveryShipmentItem {
  return {
    ...item,
    itemNumber: item.itemNumber || String(index + 1),
    duty: getItemDutyAmount(item),
    landedCost: getItemLandedCostAmount(item),
  }
}

function getDisplayItems(detail?: RecoveryShipmentDetail): RecoveryShipmentItem[] {
  if (!detail) return []
  const rawItems = detail.items?.length
    ? detail.items
    : detail.poItems?.length
      ? detail.poItems
      : detail.c88Items || []
  return rawItems.map((item, index) => normalizeShipmentItem(item, index))
}

function shipmentStatusText(statusCode?: number): string {
  switch (statusCode) {
    case 1:
      return 'HS Code Processing'
    case 2:
      return 'C88 Upload Pending'
    case 3:
      return 'Shipment Processing'
    case 4:
      return 'Shipment Pending'
    case 5:
      return 'Shipment Successful'
    case 6:
      return 'Shipment Rejected'
    case 7:
      return 'HS Code Challenged'
    case 8:
      return 'Item Mapping Failed'
    case 9:
      return 'Cost Discrepancy'
    default:
      return 'Shipment Processing'
  }
}

function isItemFlagged(item: RecoveryShipmentItem): boolean {
  return Boolean(item.flagged || item.isFlagged)
}

function formatMoney(value: unknown, currencySymbol = '£'): string {
  const n = toNumber(value, 0)
  return `${currencySymbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function buildShipmentDetailCsv(
  detail?: RecoveryShipmentDetail,
  items: RecoveryShipmentItem[] = [],
): string {
  const headers = [
    'ShipmentTitle',
    'Date',
    'ShipVia',
    'PO Number',
    'Status',
    'Requisitioner',
    'ShippingTerms',
    'Item Number',
    'Description',
    'Quantity',
    'Currency',
    'Unit Price',
    'HS Code',
    'Duty',
    'Landed Cost',
  ]
  const statusCode = mapRecoveryStatusToLegacy(detail?.status)
  const rows = (items.length ? items : [{}]).map((item) => [
    detail?.shipmentTitle || detail?.shipmentReference || detail?.sourceShipmentId || '-',
    formatDate(detail?.date),
    detail?.shipVia || '-',
    detail?.purchaseOrderNumber || '-',
    shipmentStatusText(statusCode),
    detail?.requisitioner || '-',
    detail?.shippingTerms || '-',
    item.itemNumber || '-',
    item.description || '-',
    String(item.qty ?? '-'),
    detail?.unit || 'USD',
    String(item.unitPrice ?? 0),
    item.hsCode || '-',
    String(item.duty ?? 0),
    String(item.landedCost ?? 0),
  ])
  const escapeCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return [headers, ...rows]
    .map((line) => line.map((c) => escapeCell(String(c))).join(','))
    .join('\r\n')
}

export function ShipmentDetailPageV2() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all')
  const [copied, setCopied] = useState(false)
  const [showLandedCost, setShowLandedCost] = useState(false)
  const [landedCostData, setLandedCostData] = useState<{
    poItem?: RecoveryShipmentItem
    c88Item?: RecoveryShipmentItem
    estimatedTotal: number
    actualTotal: number
  } | null>(null)

  const { data, isLoading, isFetching } = useGetRecoveryShipmentByIdQuery(id, { skip: !id })
  const [fetchLandedCost, { isFetching: isLandedCostFetching }] =
    useLazyGetRecoveryShipmentLandedCostQuery()
  const detail = data?.content
  const allItems = useMemo(() => getDisplayItems(detail), [detail])
  const poItems = useMemo(
    () => (detail?.poItems || []).map((item, index) => normalizeShipmentItem(item, index)),
    [detail?.poItems],
  )
  const c88Items = useMemo(
    () => (detail?.c88Items || []).map((item, index) => normalizeShipmentItem(item, index)),
    [detail?.c88Items],
  )
  const filteredItems = useMemo(() => {
    if (itemFilter === 'flagged') return allItems.filter(isItemFlagged)
    if (itemFilter === 'unflagged') return allItems.filter((item) => !isItemFlagged(item))
    return allItems
  }, [allItems, itemFilter])

  const displayStatusCode = mapRecoveryStatusToLegacy(detail?.status)

  const currencySymbol = '£'
  const selectedItem = filteredItems[0]
  const detailLabels = {
    companyName: t('shipments.detail.companyName'),
    address1: t('shipments.detail.address1'),
    address2: t('shipments.detail.address2'),
    country: t('shipments.detail.country'),
    city: t('shipments.detail.city'),
    phoneNumber: t('shipments.detail.phoneNumber'),
    fax: t('shipments.detail.fax'),
    website: t('shipments.detail.website'),
    industryType: t('shipments.detail.industryType'),
    postalCode: t('shipments.detail.postalCode'),
  }

  if (!id) {
    return (
      <div className="rounded-lg bg-white p-6 text-sm text-black">
        {t('shipments.detail.notFound')}
      </div>
    )
  }

  if (isLoading || isFetching) {
    return (
      <div
        id="report-content"
        className="flex min-h-[40vh] items-center justify-center bg-white p-3 sm:p-6"
      >
        <div className="text-sm text-lightBlackOne">{t('common.loading')}</div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="rounded-lg bg-white p-6 text-sm text-black">
        {t('shipments.detail.notFound')}
      </div>
    )
  }

  const handleOpenLandedCost = async () => {
    if (!id) return
    try {
      const response = await fetchLandedCost(id)
      const payload =
        (response as { data?: { content?: RecoveryShipmentLandedCostContent } })?.data?.content ||
        {}
      const landedCostRows = Array.isArray(payload?.landed_cost) ? payload.landed_cost : []
      const firstPair = landedCostRows.find(
        (pair: unknown) =>
          Array.isArray(pair) &&
          (Object.keys((pair[0] as object) || {}).length > 0 ||
            Object.keys((pair[1] as object) || {}).length > 0),
      ) as [RecoveryShipmentItem, RecoveryShipmentItem] | undefined

      const poItem =
        firstPair?.[0] && Object.keys(firstPair[0]).length > 0 ? firstPair[0] : undefined
      const c88Item =
        firstPair?.[1] && Object.keys(firstPair[1]).length > 0 ? firstPair[1] : undefined

      const fallbackPoItem =
        (selectedItem?.itemNumber
          ? poItems.find((item) => item.itemNumber === selectedItem.itemNumber)
          : undefined) || poItems[0]
      const fallbackC88Item =
        (selectedItem?.itemNumber
          ? c88Items.find((item) => item.itemNumber === selectedItem.itemNumber)
          : undefined) || c88Items[0]

      setLandedCostData({
        poItem: poItem || fallbackPoItem || selectedItem,
        c88Item: c88Item || fallbackC88Item || selectedItem,
        estimatedTotal:
          toOptionalNumber(payload?.total_estimated_landed_cost) ??
          getItemLandedCostAmount(poItem || fallbackPoItem || selectedItem),
        actualTotal:
          toOptionalNumber(payload?.total_actual_landed_cost) ??
          getItemLandedCostAmount(c88Item || fallbackC88Item || selectedItem),
      })
      setShowLandedCost(true)
    } catch {
      setShowLandedCost(true)
      setLandedCostData(null)
    }
  }

  return (
    <div id="report-content" className="flex w-full min-w-0 flex-col gap-5 bg-white p-3 sm:p-6">
      <>
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/shipments')}
              className="flex h-6 w-6 items-center justify-center rounded border border-bottomBorder"
            >
              <span className="icon-arrow-left text-large text-black" />
            </button>
            <p
              className="max-w-[58vw] truncate text-base font-medium text-black sm:max-w-[70vw] sm:text-lg"
              title={
                detail.shipmentTitle || detail.shipmentReference || detail.sourceShipmentId || ''
              }
            >
              {detail.shipmentTitle ||
                detail.shipmentReference ||
                detail.sourceShipmentId ||
                'Untitled Shipment'}
            </p>
          </div>
          <div
            className={`flex w-fit max-w-full items-center gap-2 rounded-md px-3 py-1 text-sm font-medium capitalize ${getShipmentStatusBadgeClassName(displayStatusCode)}`}
          >
            <span className="icon-dot mt-0.5 text-[5px] text-current" />
            <span className="truncate whitespace-nowrap">
              {shipmentStatusText(displayStatusCode)}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-2 md:justify-end">
          <button
            type="button"
            className="flex min-w-0 flex-row items-center gap-2 rounded-md border border-bottomBorder bg-white p-2"
          >
            <span className="icon-File-text text-xs text-black md:text-sm" />
            <p className="truncate text-xs font-light text-black md:text-sm">
              {t('shipments.rowAction.viewLogs')}
            </p>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex min-w-0 flex-row items-center gap-2 rounded-md border border-bottomBorder bg-white p-2"
          >
            <span className="icon-pdf text-xs text-black md:text-sm" />
            <p className="truncate text-xs font-light text-black md:text-sm">
              {t('shipments.detail.action.downloadPdf')}
            </p>
          </button>
          <CsvExportButton
            buttonText={t('shipments.detail.action.exportCsv')}
            onClick={() => {
              const csv = buildShipmentDetailCsv(detail, filteredItems)
              downloadTextFile(csv, `shipment-${id}.csv`)
            }}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-lg bg-greyFour px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-lightBlackOne sm:text-sm">
              {t('shipments.detail.purchaseOrderNumber')}
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <p
                className="max-w-[65vw] truncate text-sm font-normal text-yellow sm:max-w-[40vw] sm:text-lg"
                title={detail.purchaseOrderNumber || ''}
              >
                {detail.purchaseOrderNumber || '-'}
              </p>
              <button
                type="button"
                onClick={async () => {
                  if (!detail.purchaseOrderNumber) return
                  await navigator.clipboard.writeText(detail.purchaseOrderNumber)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1200)
                }}
              >
                <span
                  className={`${copied ? 'icon-tick text-green' : 'icon-copy-text text-lightBlackOne'} text-xs sm:text-sm`}
                />
              </button>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-lightBlackOne sm:text-sm">{t('shipments.table.col.date')}</p>
            <p className="text-sm font-normal text-black sm:text-lg">{formatDate(detail.date)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div
            className="max-w-full rounded-md bg-greyFour p-2 text-xs sm:text-sm"
            title={detail.requisitioner || '-'}
          >
            <span className="font-medium">{t('shipments.detail.requisitioner')}: </span>
            <span className="inline-block max-w-full truncate align-bottom">
              {detail.requisitioner || '-'}
            </span>
          </div>
          <div
            className="max-w-full rounded-md bg-greyFour p-2 text-xs sm:text-sm"
            title={detail.shipVia || '-'}
          >
            <span className="font-medium">{t('shipments.detail.shipVia')}: </span>
            <span className="inline-block max-w-full truncate align-bottom">
              {detail.shipVia || '-'}
            </span>
          </div>
          <div
            className="max-w-full rounded-md bg-greyFour p-2 text-xs sm:text-sm"
            title={detail.shippingTerms || '-'}
          >
            <span className="font-medium">{t('shipments.detail.shippingTerms')}: </span>
            <span className="inline-block max-w-full truncate align-bottom">
              {detail.shippingTerms || '-'}
            </span>
          </div>
        </div>

        <DetailsGridCard
          title={t('shipments.detail.companyInformation')}
          party={detail.company}
          labels={detailLabels}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DetailsGridCard
            title={t('shipments.detail.vendorDetails')}
            party={detail.vendor}
            labels={detailLabels}
          />
          <DetailsGridCard
            title={t('shipments.detail.shipToDetails')}
            party={detail.shipTo}
            labels={detailLabels}
          />
        </div>

        <div className="mt-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-lg font-semibold text-black">{t('shipments.detail.shipmentItems')}</p>
          <div className="w-full sm:w-40">
            <DropdownField
              id="shipment-item-filter"
              options={[
                { value: 'all', label: t('shipments.detail.filter.all') },
                { value: 'flagged', label: t('shipments.detail.filter.flagged') },
                { value: 'unflagged', label: t('shipments.detail.filter.unflagged') },
              ]}
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value as ItemFilter)}
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-lg border border-bottomBorder">
          <table className="w-full min-w-[860px] table-auto bg-white">
            <thead className="bg-greyFour text-black">
              <tr className="text-left text-xs sm:text-sm">
                <th className="w-[70px] p-3 whitespace-nowrap">
                  {t('shipments.detail.col.itemNumber')}
                </th>
                <th className="min-w-[240px] p-3 whitespace-nowrap">
                  {t('shipments.detail.col.description')}
                </th>
                <th className="w-[120px] p-3 whitespace-nowrap">
                  {t('shipments.detail.col.hsCode')}
                </th>
                <th className="w-[110px] p-3 whitespace-nowrap">
                  {t('shipments.detail.col.unitPrice')}
                </th>
                <th className="w-[80px] p-3 whitespace-nowrap">{t('shipments.detail.col.qty')}</th>
                <th className="w-[110px] p-3 whitespace-nowrap">
                  {t('shipments.detail.col.total')}
                </th>
                <th className="w-[95px] p-3 whitespace-nowrap">{t('shipments.detail.col.duty')}</th>
                <th className="w-[130px] p-3 whitespace-nowrap">
                  {t('shipments.detail.col.landedCost')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr
                  key={item.id || item._id || `${idx}`}
                  className="border-t border-bottomBorder text-xs sm:text-sm"
                >
                  <td className="p-3 align-middle">{item.itemNumber || '-'}</td>
                  <td className="p-3 align-middle">
                    <p
                      className="overflow-hidden break-words leading-6"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.description || '-'}
                    </p>
                  </td>
                  <td className="p-3 align-middle whitespace-nowrap">{item.hsCode || '-'}</td>
                  <td className="p-3 align-middle whitespace-nowrap">
                    {formatMoney(item.unitPrice, currencySymbol)}
                  </td>
                  <td className="p-3 align-middle whitespace-nowrap">{item.qty ?? '-'}</td>
                  <td className="p-3 align-middle whitespace-nowrap">
                    {formatMoney(
                      toOptionalNumber(item.totalPrice) ??
                        toNumber(item.unitPrice) * toNumber(item.qty),
                      currencySymbol,
                    )}
                  </td>
                  <td className="p-3 align-middle whitespace-nowrap">
                    {formatMoney(item.duty, currencySymbol)}
                  </td>
                  <td className="p-3 align-middle whitespace-nowrap">
                    {formatMoney(item.landedCost, currencySymbol)}
                  </td>
                </tr>
              ))}
              {!filteredItems.length ? (
                <tr>
                  <td className="p-3 text-sm text-lightBlackOne" colSpan={8}>
                    {t('shipments.detail.noShipmentItems')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <PrimaryButton
            onClick={handleOpenLandedCost}
            className="bg-yellow px-4 py-2 text-xs font-light text-white hover:bg-yellow md:text-sm"
            disabled={isLandedCostFetching}
          >
            {isLandedCostFetching
              ? t('common.loading')
              : t('shipments.detail.viewLandedCostComparison')}
          </PrimaryButton>
        </div>

        {showLandedCost ? (
          <LandedCostComparisonModal
            poItem={landedCostData?.poItem}
            c88Item={landedCostData?.c88Item}
            estimatedTotal={landedCostData?.estimatedTotal ?? 0}
            actualTotal={landedCostData?.actualTotal ?? 0}
            currencySymbol={currencySymbol}
            reportFileName={`shipment-landed-cost-report-${id}.csv`}
            reportContent={buildShipmentDetailCsv(detail, filteredItems)}
            onClose={() => {
              setShowLandedCost(false)
              setLandedCostData(null)
            }}
            formatMoney={formatMoney}
          />
        ) : null}
      </>
    </div>
  )
}
