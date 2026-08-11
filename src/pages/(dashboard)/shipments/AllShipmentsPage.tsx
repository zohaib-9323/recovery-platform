import { useCallback, useEffect, useMemo, useState } from 'react'

import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import {
  useGetRecoveryPreferencesQuery,
  useGetRecoveryShipmentsListQuery,
  useUpdateRecoveryShipmentSanctionDecisionMutation,
} from '@/app/services/recoveryApi'
import { formatShipmentListDate } from '@/lib/format-shipment-list-date'
import {
  getShipmentStatusText,
  isShipmentListDisplayStatus,
} from '@/lib/manage-shipments-table-helper'
import { mapRecoveryStatusToLegacy } from '@/lib/recovery-shipment-status-map'
import { buildSanctionModalProps } from '@/lib/sanction-modal-helper'
import { resolveShipmentStatusForDisplay } from '@/lib/sanction-decision'
import { showCustomToast } from '@/lib/showCustomToast'
import type { RecoveryShipmentRecord } from '@/types/recovery-shipments-api'

import {
  AllShipmentsDataTable,
  type ManageShipmentsTableRow,
} from './components/all-shipments-data-table'
import { SanctionResultModal } from './components/sanction-result-modal'
import { ShipmentsBulkActionsBar } from './components/shipments-bulk-actions-bar'
import type { ShipmentListCsvRow } from './components/shipments-csv-types'
import { ShipmentsPageToolbar } from './components/shipments-page-toolbar'
import { UploadC88DocumentModal } from './components/upload-c88-document-modal'
import { MS } from '@/lib/manage-shipments-copy'

function toNumericRefundStatus(s: RecoveryShipmentRecord): number | undefined {
  const raw = s.refund_status ?? s.refundStatus
  if (raw === undefined || raw === null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/** Recovery list payloads often omit `c88DocumentUrl` but include S3 key / filename / items. */
function recoveryListShipmentHasC88Document(shipment: RecoveryShipmentRecord): boolean {
  const url = shipment.c88DocumentUrl
  if (url !== null && url !== undefined && String(url).trim() !== '') {
    return true
  }
  const key = shipment.c88S3Key
  if (key !== null && key !== undefined && String(key).trim() !== '') {
    return true
  }
  const name = shipment.c88Filename
  if (name !== null && name !== undefined && String(name).trim() !== '') {
    return true
  }
  const items = shipment.c88Items
  if (Array.isArray(items) && items.length > 0) {
    return true
  }
  return false
}

function toManageShipmentsTableRow(shipment: RecoveryShipmentRecord): ManageShipmentsTableRow {
  const status = mapRecoveryStatusToLegacy(shipment.status)
  const refund_status = toNumericRefundStatus(shipment)
  const c88Raw = shipment.c88DocumentUrl
  const trimmed = c88Raw === null || c88Raw === undefined ? '' : String(c88Raw).trim()
  const c88DocumentUrl = trimmed === '' ? '' : trimmed
  const hasC88Document = recoveryListShipmentHasC88Document(shipment)
  const fnRaw = shipment.c88Filename
  const c88Filename =
    fnRaw === null || fnRaw === undefined ? undefined : String(fnRaw).trim() || undefined

  return {
    _id: shipment._id,
    shipmentTitle: shipment.shipmentTitle || shipment.shipmentReference || 'Untitled Shipment',
    dateRaw: shipment.date,
    createdAtRaw: shipment.createdAt,
    shipVia: shipment.shipVia || '',
    purchaseOrderNumber: shipment.purchaseOrderNumber || '',
    status,
    refund_status,
    refunded_amount: shipment.refund?.refunded_amount,
    c88DocumentUrl,
    hasC88Document,
    c88Filename,
    screeningStatus: shipment.screeningStatus,
    sanctionsScreeningStatus: shipment.sanctionsScreeningStatus,
    sanctionDecision: shipment.sanctionDecision,
    is_flagged: shipment.is_flagged,
    is_challenged: shipment.is_challenged,
    vendor: shipment.vendor,
    vendorId: shipment.vendorId,
    sanctionsMatch: shipment.sanctionsMatch,
  }
}

export function AllShipmentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [csvData, setCsvData] = useState<ShipmentListCsvRow[]>([])
  const [uploadC88Open, setUploadC88Open] = useState(false)
  const [uploadC88ShipmentId, setUploadC88ShipmentId] = useState<string | null>(null)
  const [selectedSanctionShipment, setSelectedSanctionShipment] =
    useState<ManageShipmentsTableRow | null>(null)
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false)

  const { data: prefs } = useGetRecoveryPreferencesQuery()
  const timeZone = prefs?.content?.timezone ?? null

  const { data, isFetching, refetch } = useGetRecoveryShipmentsListQuery(
    {
      page: currentPage,
      limit: pageSize,
      pageSize,
      search: debouncedSearch.trim() || undefined,
    },
    // Without this, navigating away and back to this page (component remount, same
    // args) serves the RTK Query cache as-is instead of refetching — the list looks
    // stale until a full page reload until the cache naturally expires.
    { refetchOnMountOrArgChange: true },
  )

  const [updateSanctionDecision, { isLoading: isUpdatingSanctionDecision }] =
    useUpdateRecoveryShipmentSanctionDecisionMutation()

  const rows = useMemo(
    () =>
      (data?.content?.data ?? data?.content?.shipments ?? []).map((s) =>
        toManageShipmentsTableRow(s),
      ),
    [data?.content?.data, data?.content?.shipments],
  )

  const totalPages = Math.max(1, data?.content?.totalPages ?? 1)
  const safePage = Math.min(Math.max(1, currentPage), totalPages)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(t)
  }, [searchQuery])

  const isAllSelected = rows.length > 0 && selectedUserIds.length === rows.length

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(rows.map((r) => r._id))
    }
  }, [isAllSelected, rows])

  const handleSelect = useCallback((id: string) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const generateCsv = useCallback(() => {
    const selectedData = rows
      .filter((r) => selectedUserIds.includes(r._id))
      .map((r) => {
        const displayStatus = resolveShipmentStatusForDisplay(
          Number(r.status),
          r.sanctionDecision as 'stopped' | 'ignored' | 'none' | undefined,
        )
        return {
          ShipmentTitle: r.shipmentTitle || 'N/A',
          Date: formatShipmentListDate(r.dateRaw, timeZone),
          ShipVia: r.shipVia || 'N/A',
          'PO Number': r.purchaseOrderNumber || 'N/A',
          Status: isShipmentListDisplayStatus(displayStatus)
            ? getShipmentStatusText(displayStatus)
            : getShipmentStatusText(3),
        }
      })
    setCsvData(selectedData as ShipmentListCsvRow[])
  }, [rows, selectedUserIds, timeZone])

  const handleSanctionWarning = useCallback((shipment: ManageShipmentsTableRow) => {
    setSelectedSanctionShipment(shipment)
    setIsSanctionModalOpen(true)
  }, [])

  const handleSanctionDecision = async (decision: 'stopped' | 'ignored') => {
    if (!selectedSanctionShipment) return
    const previousDecision = selectedSanctionShipment.sanctionDecision
    try {
      await updateSanctionDecision({
        shipmentId: selectedSanctionShipment._id,
        decision,
      }).unwrap()
      setIsSanctionModalOpen(false)
      setSelectedSanctionShipment(null)
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

  const uploadC88Row = rows.find((r) => r._id === uploadC88ShipmentId)
  const listLoading = isFetching

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 bg-white p-3 sm:p-5">
        <ShipmentsPageToolbar
          search={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v)
            setCurrentPage(1)
          }}
        />

        {listLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <CustomLoader />
          </div>
        ) : (
          <>
            {rows.length > 0 ? (
              <div className="flex min-h-0 w-full flex-1 flex-col gap-3 rounded-lg border border-bottomBorder p-4">
                <ShipmentsBulkActionsBar
                  isAllSelected={isAllSelected}
                  onSelectAll={handleSelectAll}
                  csvData={csvData}
                  onGenerateCsv={generateCsv}
                  isExportDisabled={selectedUserIds.length === 0}
                />
                <div className="w-full">
                  <AllShipmentsDataTable
                    data={rows}
                    selectedUserIds={selectedUserIds}
                    onCheckChange={handleSelect}
                    onSanctionWarning={handleSanctionWarning}
                    uploadC88Document={(id) => {
                      setUploadC88ShipmentId(id)
                      setUploadC88Open(true)
                    }}
                    timeZone={timeZone}
                  />
                </div>
                {totalPages > 1 ? (
                  <CustomPagination
                    totalPages={totalPages}
                    currentPage={safePage}
                    onPageChange={setCurrentPage}
                  />
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 w-full flex-col items-center justify-center gap-3 rounded-lg border border-bottomBorder p-4">
                <div className="flex w-full max-w-lg flex-col items-center justify-center gap-5">
                  <img src="/images/emptybox.svg" alt="" width={200} height={200} />

                  <p className="text-center text-lg font-light text-black">
                    {MS.noshipmentsAvailable}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {uploadC88Open && uploadC88ShipmentId ? (
        <UploadC88DocumentModal
          shipmentId={uploadC88ShipmentId}
          uploadedDocument={uploadC88Row?.c88DocumentUrl || undefined}
          onClose={() => {
            setUploadC88Open(false)
            setUploadC88ShipmentId(null)
          }}
          refetch={() => {
            void refetch()
          }}
        />
      ) : null}

      {selectedSanctionShipment ? (
        <SanctionResultModal
          isOpen={isSanctionModalOpen}
          onClose={() => {
            setIsSanctionModalOpen(false)
            setSelectedSanctionShipment(null)
          }}
          {...buildSanctionModalProps(selectedSanctionShipment)}
          currentDecision={
            selectedSanctionShipment.sanctionDecision as 'stopped' | 'ignored' | 'none' | null
          }
          onDecision={handleSanctionDecision}
          isLoading={isUpdatingSanctionDecision}
        />
      ) : null}
    </>
  )
}
