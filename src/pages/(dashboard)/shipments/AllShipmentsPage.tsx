import { useCallback, useEffect, useMemo, useState } from 'react'

import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import {
  useGetRecoveryPreferencesQuery,
  useGetRecoveryShipmentsListQuery,
} from '@/app/services/recoveryApi'
import { formatShipmentListDate } from '@/lib/format-shipment-list-date'
import { getRefundStatusText, getShipmentStatusText } from '@/lib/manage-shipments-table-helper'
import { mapRecoveryStatusToLegacy } from '@/lib/recovery-shipment-status-map'
import type { RecoveryShipmentRecord } from '@/types/recovery-shipments-api'

import {
  AllShipmentsDataTable,
  type ManageShipmentsTableRow,
} from './components/all-shipments-data-table'
import { ShipmentsBulkActionsBar } from './components/shipments-bulk-actions-bar'
import type { ShipmentListCsvRow } from './components/shipments-csv-types'
import { ShipmentsPageToolbar } from './components/shipments-page-toolbar'
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
    shipVia: shipment.shipVia || '',
    purchaseOrderNumber: shipment.purchaseOrderNumber || '',
    status,
    refund_status,
    c88DocumentUrl,
    hasC88Document,
    c88Filename,
    screeningStatus: shipment.screeningStatus,
    sanctionsScreeningStatus: shipment.sanctionsScreeningStatus,
    sanctionDecision: shipment.sanctionDecision,
    is_flagged: shipment.is_flagged,
    is_challenged: shipment.is_challenged,
    refunded_amount: shipment.refund?.refunded_amount,
  }
}

export function AllShipmentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [csvData, setCsvData] = useState<ShipmentListCsvRow[]>([])

  const { data: prefs } = useGetRecoveryPreferencesQuery()
  const timeZone = prefs?.content?.timezone ?? null

  const { data, isFetching } = useGetRecoveryShipmentsListQuery({
    page: currentPage,
    limit: pageSize,
    pageSize,
    search: debouncedSearch.trim() || undefined,
  })

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
      .map((r) => ({
        ShipmentTitle: r.shipmentTitle || 'N/A',
        Date: formatShipmentListDate(r.dateRaw, timeZone),
        ShipVia: r.shipVia || 'N/A',
        'PO Number': r.purchaseOrderNumber || 'N/A',
        Status:
          r.refund_status === 2
            ? getRefundStatusText(r.refund_status, true)
            : [1, 2, 3, 5, 6, 7, 9].includes(Number(r.status))
              ? getShipmentStatusText(Number(r.status))
              : getShipmentStatusText(3),
      }))
    setCsvData(selectedData as ShipmentListCsvRow[])
  }, [rows, selectedUserIds, timeZone])

  const listLoading = isFetching

  return (
    <>
      <div className="flex flex-col gap-5 bg-white p-3 sm:p-5">
        <ShipmentsPageToolbar
          search={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v)
            setCurrentPage(1)
          }}
          onCreateShipment={() => {}}
        />

        {listLoading ? (
          <div className="flex h-[70svh] items-center justify-center">
            <CustomLoader />
          </div>
        ) : (
          <>
            {rows.length > 0 ? (
              <div className="flex w-full flex-col gap-3 overflow-hidden rounded-lg border border-bottomBorder p-4">
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
                    onSanctionWarning={() => {}}
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
              <div className="flex h-[69svh] w-full flex-col items-center justify-center gap-3 rounded-lg border border-bottomBorder p-4 2xl:h-[79svh]">
                <div className="flex h-full min-h-full w-full max-w-lg flex-grow flex-col items-center justify-center gap-5">
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
    </>
  )
}
