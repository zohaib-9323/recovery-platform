/* eslint-disable max-lines */
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  useGetRecoveryPreferencesQuery,
  useGetRecoveryShipmentByIdQuery,
  useLazyGetRecoveryShipmentLandedCostQuery,
  useUpdateRecoveryShipmentSanctionDecisionMutation,
} from '@/app/services/recoveryApi'
import { CsvExportButton, PrimaryButton } from '@/components/buttons'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { DropdownField } from '@/components/fields'
import { formatShipmentListDate } from '@/lib/format-shipment-list-date'
import { MS } from '@/lib/manage-shipments-copy'
import { useI18n } from '@/i18n/useI18n'
import {
  getRefundStatusStyle,
  getRefundStatusText,
  getShipmentStatusStyle,
  getShipmentStatusText,
  isShipmentListDisplayStatus,
  shouldShowRefundStatusBadge,
} from '@/lib/manage-shipments-table-helper'
import { mapRecoveryStatusToLegacy } from '@/lib/recovery-shipment-status-map'
import { buildSanctionModalProps } from '@/lib/sanction-modal-helper'
import { downloadShipmentDetailPdf } from '@/lib/download-shipment-detail-pdf'
import {
  hasSanctionMatch,
  isSanctionStopped,
  needsSanctionDecision,
  resolveShipmentStatusForDisplay,
} from '@/lib/sanction-decision'
import { showCustomToast } from '@/lib/showCustomToast'
import { DetailsGridCard } from '@/pages/(dashboard)/shipments/components/details-grid-card'
import {
  FileUploadsSidebar,
  type ShipmentDocumentRow,
} from '@/pages/(dashboard)/shipments/components/file-uploads-sidebar'
import {
  LandedCostComparisonModal,
  type LandedCostComparisonContent,
} from '@/pages/(dashboard)/shipments/components/landed-cost-comparison-modal'
import { SanctionResultModal } from '@/pages/(dashboard)/shipments/components/sanction-result-modal'
import { ShipmentItemsTable } from '@/pages/(dashboard)/shipments/components/shipment-items-table'
import { UploadC88DocumentModal } from '@/pages/(dashboard)/shipments/components/upload-c88-document-modal'
import type { RecoveryShipmentDetail, RecoveryShipmentItem } from '@/types/recovery-shipments-api'

type ItemFilter = 'All' | 'Flagged' | 'Unflagged'

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
    Total: item.Total ?? item.totalPrice,
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

function isItemFlagged(item: RecoveryShipmentItem): boolean {
  return Boolean(item.flagged || item.isFlagged || item.is_flagged === 1)
}

function toNumericRefundStatus(detail?: RecoveryShipmentDetail): number | undefined {
  const raw = detail?.refund_status ?? detail?.refundStatus
  if (raw === undefined || raw === null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function recoveryDetailHasC88Document(detail?: RecoveryShipmentDetail): boolean {
  if (!detail) return false
  const url = detail.c88DocumentUrl
  if (url !== null && url !== undefined && String(url).trim() !== '') return true
  const key = detail.c88S3Key
  if (key !== null && key !== undefined && String(key).trim() !== '') return true
  const name = detail.c88Filename
  if (name !== null && name !== undefined && String(name).trim() !== '') return true
  const items = detail.c88Items
  if (Array.isArray(items) && items.length > 0) return true
  return false
}

export function ShipmentDetailPageV2() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { id = '' } = useParams()
  const [itemFilter, setItemFilter] = useState<ItemFilter>('All')
  const [copied, setCopied] = useState(false)
  const [showLandedCost, setShowLandedCost] = useState(false)
  const [landedCostContent, setLandedCostContent] = useState<LandedCostComparisonContent | null>(
    null,
  )
  const [uploadDocument, setUploadDocument] = useState(false)
  const [showFileUploads, setShowFileUploads] = useState(false)
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false)
  const [isPdfDownloading, setIsPdfDownloading] = useState(false)
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([])

  const { data: prefs } = useGetRecoveryPreferencesQuery()
  const timeZone = prefs?.content?.timezone ?? null

  const { data, isLoading, isFetching, refetch } = useGetRecoveryShipmentByIdQuery(id, {
    skip: !id,
  })
  const [fetchLandedCost, { isFetching: isLandedCostFetching }] =
    useLazyGetRecoveryShipmentLandedCostQuery()
  const [updateSanctionDecision, { isLoading: isUpdatingSanctionDecision }] =
    useUpdateRecoveryShipmentSanctionDecisionMutation()

  const detail = data?.content
  const allItems = useMemo(() => getDisplayItems(detail), [detail])
  const filteredItems = useMemo(() => {
    if (itemFilter === 'Flagged') return allItems.filter(isItemFlagged)
    if (itemFilter === 'Unflagged') return allItems.filter((item) => !isItemFlagged(item))
    return allItems
  }, [allItems, itemFilter])

  const legacyStatus = mapRecoveryStatusToLegacy(detail?.status)
  const displayStatusCode = resolveShipmentStatusForDisplay(
    legacyStatus,
    detail?.sanctionDecision as 'stopped' | 'ignored' | 'none' | undefined,
  )
  const refundStatus = toNumericRefundStatus(detail)
  const showRefundBadge = shouldShowRefundStatusBadge(refundStatus, displayStatusCode)
  const hasC88Document = recoveryDetailHasC88Document(detail)

  const detailLabels = {
    companyName: 'Company Name',
    address1: 'Address 1',
    address2: 'Address 2',
    country: 'Country',
    city: 'City',
    phoneNumber: 'Phone Number',
    fax: 'Fax',
    website: 'Website',
    industryType: 'Industry Type',
    postalCode: 'Postal Code',
  }

  if (!id) {
    return (
      <div className="flex min-h-0 flex-1 rounded-lg bg-white p-6 text-sm text-black">
        {t('shipments.detail.notFound')}
      </div>
    )
  }

  if (isLoading || isFetching) {
    return (
      <div
        id="report-content"
        className="flex min-h-0 flex-1 items-center justify-center bg-white p-3 sm:p-6"
      >
        <CustomLoader />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex min-h-0 flex-1 rounded-lg bg-white p-6 text-sm text-black">
        {t('shipments.detail.notFound')}
      </div>
    )
  }

  const handleOpenLandedCost = async () => {
    if (!id) return
    setShowLandedCost(true)
    try {
      const response = await fetchLandedCost(id)
      const payload = response?.data?.content ?? null
      setLandedCostContent(payload as LandedCostComparisonContent | null)
    } catch {
      setLandedCostContent(null)
    }
  }

  const handleSanctionDecision = async (decision: 'stopped' | 'ignored') => {
    if (!id) return
    const previousDecision = detail.sanctionDecision
    try {
      await updateSanctionDecision({ shipmentId: id, decision }).unwrap()
      setIsSanctionModalOpen(false)
      refetch()
      const toastMessage =
        decision === 'stopped'
          ? 'Shipment processing has been stopped due to the DPS match.'
          : previousDecision === 'stopped'
            ? 'Decision updated. You can continue processing this shipment.'
            : 'Shipment marked as ignored. You can continue processing.'
      showCustomToast({
        type: 'success',
        title: 'Decision Recorded',
        message: toastMessage,
      })
    } catch {
      showCustomToast({
        type: 'error',
        title: MS.error,
        message: 'Failed to update decision',
      })
    }
  }

  const generateCsv = () => {
    const baseShipmentData = {
      ShipmentTitle: detail.shipmentTitle || 'N/A',
      Date: formatShipmentListDate(detail.date, timeZone),
      ShipVia: detail.shipVia || 'N/A',
      'PO Number': detail.purchaseOrderNumber || 'N/A',
      Status: isShipmentListDisplayStatus(displayStatusCode)
        ? getShipmentStatusText(displayStatusCode)
        : getShipmentStatusText(3),
      Requisitioner: detail.requisitioner || 'N/A',
      ShippingTerms: detail.shippingTerms || 'N/A',
    }
    if (filteredItems.length > 0) {
      setCsvData(
        filteredItems.map((item, index) => ({
          ...(index === 0 ? baseShipmentData : {}),
          'Item Number': item.itemNumber || 'N/A',
          Description: item.description || 'N/A',
          Quantity: item.qty || 'N/A',
          Currency: detail.unit ?? 'USD',
          'Unit Price': item.unitPrice ?? 0,
          'HS Code': item.hsCode || 'N/A',
          Duty: item.duty ?? 0,
          'Landed Cost': item.landedCost ?? 0,
        })),
      )
    } else {
      setCsvData([baseShipmentData])
    }
  }

  const landedCostDisabled =
    !hasC88Document ||
    (![5, 9].includes(legacyStatus) && ![2, 4].includes(Number(refundStatus ?? 0)))

  const downloadAsPDF = async () => {
    if (!id || isPdfDownloading) return
    setIsPdfDownloading(true)
    try {
      await downloadShipmentDetailPdf(id)
    } catch {
      showCustomToast({
        type: 'error',
        title: MS.error,
        message: 'Failed to generate PDF.',
      })
    } finally {
      setIsPdfDownloading(false)
    }
  }

  const hasDocValue = (value?: string | null) => typeof value === 'string' && value.trim() !== ''
  const shipmentDocuments: ShipmentDocumentRow[] = []
  if (hasC88Document) {
    shipmentDocuments.push({
      type: 'c88',
      label: 'C88 Document',
      fileName: detail.c88Filename ?? undefined,
    })
  }
  if (
    hasDocValue(detail.poS3Key) ||
    hasDocValue(detail.poFilename) ||
    hasDocValue(detail.poDocumentUrl)
  ) {
    shipmentDocuments.push({
      type: 'po',
      label: 'Purchase Order Document',
      fileName: detail.poFilename ?? undefined,
    })
  }

  return (
    <>
      <div
        id="report-content"
        data-report-content
        className="no-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-white p-3 sm:p-6"
      >
        <div className="flex flex-col items-start justify-between gap-2 space-y-2 sm:items-center">
          <div className="flex w-full flex-col items-start justify-between space-y-2 sm:flex-row sm:items-center sm:space-y-0">
            <div id="shipment-title" className="flex flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/shipments')}
                data-pdf-exclude
                className="flex h-6 w-6 items-center justify-center rounded border border-bottomBorder"
              >
                <span className="icon-arrow-left text-large text-black" />
              </button>
              <span
                id="title"
                data-pdf-title
                className="mr-auto max-w-64 truncate text-base font-medium text-black md:max-w-lg lg:max-w-3xl lg:text-lg xl:max-w-4xl 2xl:max-w-full"
                title={
                  detail.shipmentTitle || detail.shipmentReference || detail.sourceShipmentId || ''
                }
              >
                <p className="py-3">
                  {detail.shipmentTitle ||
                    detail.shipmentReference ||
                    detail.sourceShipmentId ||
                    'Untitled Shipment'}
                </p>
              </span>
            </div>
            <div
              id="badge"
              className={`flex flex-row items-center justify-center rounded-md ${
                showRefundBadge && refundStatus !== undefined
                  ? getRefundStatusStyle(refundStatus)
                  : isShipmentListDisplayStatus(displayStatusCode)
                    ? getShipmentStatusStyle(displayStatusCode)
                    : getShipmentStatusStyle(3)
              }`}
            >
              <span className="flex w-fit items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium sm:text-sm">
                <span className="h-1 w-1 rounded-full bg-current" />
                {showRefundBadge && refundStatus !== undefined
                  ? getRefundStatusText(refundStatus, true)
                  : isShipmentListDisplayStatus(displayStatusCode)
                    ? getShipmentStatusText(displayStatusCode)
                    : getShipmentStatusText(3)}
              </span>
            </div>
          </div>

          {hasSanctionMatch(detail) && isSanctionStopped(detail.sanctionDecision) ? (
            <div className="flex w-full flex-col gap-3 rounded-lg border border-redOne bg-lightRedOne px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-black">
                Processing is stopped due to a DPS match. Choose{' '}
                <span className="font-semibold">Ignore &amp; Continue</span>{' '}
                {t('shipments.detail.sanctionStoppedContinue')}
              </p>
              <button
                type="button"
                onClick={() => setIsSanctionModalOpen(true)}
                data-pdf-exclude
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                {t('shipments.detail.updateDecision')}
              </button>
            </div>
          ) : null}

          <div
            data-pdf-exclude
            className="flex w-full flex-wrap items-center justify-start gap-2 md:justify-end"
          >
            <button
              type="button"
              onClick={() => navigate(`/shipments/${id}/logs`)}
              className="flex flex-row items-center gap-2 rounded-md border border-bottomBorder bg-white p-2"
            >
              <span className="icon-File-text text-xs text-black md:text-sm" />
              <p className="text-xs font-light text-black md:text-sm">{MS.viewShipmentLogs}</p>
            </button>
            <button
              type="button"
              id="download-pdf-button"
              onClick={() => void downloadAsPDF()}
              disabled={isPdfDownloading}
              className="flex flex-row items-center gap-2 rounded-md border border-bottomBorder bg-white p-2 disabled:opacity-50"
            >
              <span className="icon-pdf text-xs text-black md:text-sm" />
              <p className="text-xs font-light text-black md:text-sm">
                {isPdfDownloading ? 'Generating…' : MS.downloadPDF}
              </p>
            </button>
            <CsvExportButton
              isDisabled={false}
              data={csvData}
              moduleName="Shipment-Detail(Recovery)"
              className="export-btn"
              onClick={generateCsv}
              iconSize="text-xs md:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowFileUploads(true)}
              className="flex flex-row items-center gap-2 rounded-md border border-bottomBorder bg-white p-2 transition-colors"
            >
              <span className="icon-File-text text-xs text-black md:text-sm" />
              <p className="text-xs font-light text-black md:text-sm">
                {t('shipments.detail.fileUploads')}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setUploadDocument(true)}
              disabled={
                hasC88Document || [1, 6, 7].includes(legacyStatus) || needsSanctionDecision(detail)
              }
              className={`flex flex-row items-center gap-2 rounded-md p-2 disabled:bg-disableColor ${
                hasC88Document ? 'bg-green' : 'bg-yellow'
              }`}
            >
              <span className="icon-upload-cloud text-xs text-white md:text-sm" />
              <p className="text-xs font-light text-white md:text-sm">
                {hasC88Document ? MS.editC88Document : MS.uploadC88DocumentBtn}
              </p>
            </button>
          </div>
        </div>

        <div id="shipment-overview" className="flex flex-col gap-5">
          <div className="item-center flex justify-between rounded-lg bg-greyFour px-4 py-2">
            <div className="flex flex-col">
              <p className="text-xs font-normal text-lightBlackOne sm:text-sm">
                {MS.purchaseOrderNumber}
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-sm font-normal text-yellow sm:text-lg">
                  {detail.purchaseOrderNumber}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (!detail.purchaseOrderNumber) return
                    await navigator.clipboard.writeText(detail.purchaseOrderNumber)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="text-black"
                >
                  <span
                    className={`${
                      copied
                        ? 'icon-tick text-tiny text-green'
                        : 'icon-copy-text text-xs text-lightBlackOne sm:text-normal'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-normal text-lightBlackOne sm:text-sm">{MS.uploadDate}</p>
              <p className="text-sm font-normal text-black sm:text-lg">
                {formatShipmentListDate(detail.createdAt, timeZone)}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-normal text-lightBlackOne sm:text-sm">{MS.shipmentDate}</p>
              <p className="text-sm font-normal text-black sm:text-lg">
                {formatShipmentListDate(detail.date, timeZone)}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-3">
            {[
              { key: MS.requisitioner1, detail: detail.requisitioner },
              { key: MS.shipVia1, detail: detail.shipVia },
              { key: MS.shippingTerms1, detail: detail.shippingTerms },
            ].map((item) => (
              <div
                key={item.key}
                className="flex flex-col items-start gap-1 rounded-md bg-greyFour p-1.5 sm:flex-row sm:p-2"
              >
                <p className="text-xs font-medium leading-tight text-black sm:text-sm">
                  {item.key}
                </p>
                <span className="text-xs font-light leading-tight text-black sm:text-sm">
                  {item.detail}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            <DetailsGridCard
              title={MS.companyInformation}
              party={detail.company}
              labels={detailLabels}
              gridColsLimit
            />
            <div className="rounded-lg border border-bottomBorder bg-white shadow-[4px_2px_8px_0px_#00000024]">
              <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2">
                <DetailsGridCard
                  title={MS.vendorDetails}
                  party={detail.vendor}
                  labels={detailLabels}
                  gridColsLimit={false}
                  className="border-0 shadow-none"
                />
                <div className="p-5 md:p-0 md:py-5">
                  <DetailsGridCard
                    title={MS.shipToDetails}
                    party={detail.shipTo}
                    labels={detailLabels}
                    gridColsLimit={false}
                    padding="p-0 md:px-5"
                    className="border-0 shadow-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center justify-between">
            <p className="text-lg font-semibold text-black">{MS.shipmentItems}</p>
            <div data-pdf-exclude className="w-28 smallScreen:w-40">
              <DropdownField
                id="shipment-item-filter"
                options={[
                  { value: 'All', label: 'All' },
                  { value: 'Flagged', label: 'Flagged' },
                  { value: 'Unflagged', label: 'Unflagged' },
                ]}
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value as ItemFilter)}
              />
            </div>
          </div>
          <ShipmentItemsTable
            items={filteredItems}
            itemsUnit={detail.unit}
            shipmentStatus={legacyStatus}
          />
          <div data-pdf-exclude className="mb-2 mt-5 w-full">
            <div id="landed-cost-btn" className="float-right">
              <PrimaryButton
                type="button"
                onClick={handleOpenLandedCost}
                disabled={landedCostDisabled || isLandedCostFetching}
                className="bg-yellow px-4 py-2 text-xs font-light text-white hover:bg-yellow md:text-sm"
              >
                {isLandedCostFetching ? 'Loading…' : MS.viewLandedCostComparison}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {showLandedCost ? (
        <LandedCostComparisonModal
          content={landedCostContent}
          isLoading={isLandedCostFetching}
          onClose={() => {
            setShowLandedCost(false)
            setLandedCostContent(null)
          }}
        />
      ) : null}

      {showFileUploads ? (
        <FileUploadsSidebar
          shipmentId={id}
          documents={shipmentDocuments}
          onClose={() => setShowFileUploads(false)}
        />
      ) : null}

      {uploadDocument ? (
        <UploadC88DocumentModal
          shipmentId={id}
          uploadedDocument={detail.c88DocumentUrl}
          onClose={() => setUploadDocument(false)}
          refetch={() => {
            void refetch()
          }}
        />
      ) : null}

      {hasSanctionMatch(detail) ? (
        <SanctionResultModal
          isOpen={isSanctionModalOpen}
          onClose={() => setIsSanctionModalOpen(false)}
          {...buildSanctionModalProps(detail)}
          currentDecision={detail.sanctionDecision as 'stopped' | 'ignored' | 'none' | null}
          onDecision={handleSanctionDecision}
          isLoading={isUpdatingSanctionDecision}
        />
      ) : null}
    </>
  )
}
