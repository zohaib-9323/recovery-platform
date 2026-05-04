import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useGetRecoveryShipmentsListQuery } from '@/app/services/recoveryApi'
import { useI18n } from '@/i18n/useI18n'
import { AllShipmentsDataTable } from '@/pages/(dashboard)/shipments/components/all-shipments-data-table'
import { ShipmentsBulkActionsBar } from '@/pages/(dashboard)/shipments/components/shipments-bulk-actions-bar'
import { ShipmentsPageToolbar } from '@/pages/(dashboard)/shipments/components/shipments-page-toolbar'
import type { ShipmentRow } from '@/data/mock/dashboard'
import { buildShipmentsCsv, downloadTextFile } from '@/lib/csv'
import type { RecoveryShipmentRecord } from '@/types/recovery-shipments-api'
import { mapRecoveryStatusToLegacy } from '@/lib/recovery-shipment-status-map'

function formatDate(value?: string): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

function toShipmentRow(shipment: RecoveryShipmentRecord): ShipmentRow {
  const fullName = [shipment.recoveryUser?.firstName, shipment.recoveryUser?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  return {
    id: shipment._id,
    username:
      fullName ||
      shipment.userName ||
      shipment.userFullName ||
      shipment.recoveryUser?.email ||
      shipment.userEmail ||
      'Unknown user',
    title: shipment.shipmentTitle || shipment.shipmentReference || 'Untitled Shipment',
    date: formatDate(shipment.date),
    po: shipment.purchaseOrderNumber || '-',
    shipVia: shipment.shipVia || '-',
    statusCode: mapRecoveryStatusToLegacy(shipment.status),
    c88DocumentUrl: shipment.c88DocumentUrl || '',
    screeningStatus: shipment.screeningStatus,
    sanctionsScreeningStatus: shipment.sanctionsScreeningStatus,
    sanctionDecision: shipment.sanctionDecision,
    isFlagged: Boolean(shipment.is_flagged),
  }
}

export function AllShipmentsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const { data, isFetching } = useGetRecoveryShipmentsListQuery({
    page,
    limit: pageSize,
    pageSize,
    search: search.trim() || undefined,
  })

  const rows = useMemo(
    () =>
      (data?.content?.data ?? data?.content?.shipments ?? []).map((shipment) =>
        toShipmentRow(shipment),
      ),
    [data?.content?.data, data?.content?.shipments],
  )
  const pageCount = Math.max(1, data?.content?.totalPages ?? 1)
  const safePage = Math.min(Math.max(1, page), pageCount)
  const pageRows = rows

  const pageIds = useMemo(() => pageRows.map((r) => r.id), [pageRows])
  const selectAllChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const selectAllIndeterminate = !selectAllChecked && pageIds.some((id) => selectedIds.has(id))

  const handleToggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAllPage = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (checked) {
          pageIds.forEach((id) => next.add(id))
        } else {
          pageIds.forEach((id) => next.delete(id))
        }
        return next
      })
    },
    [pageIds],
  )

  const handleExportCsv = useCallback(() => {
    const ids = selectedIds
    const source = ids.size > 0 ? rows.filter((r) => ids.has(r.id)) : rows
    if (source.length === 0) return
    const csv = buildShipmentsCsv(source)
    downloadTextFile(csv, `shipments-export-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [rows, selectedIds])

  return (
    <div className="flex flex-col gap-4 bg-white p-3 lg:p-4">
      <ShipmentsPageToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        onCreateShipment={() => {}}
      />
      <div className="flex w-full flex-row items-start gap-3">
        <div className="flex w-full flex-col gap-3 overflow-hidden rounded-lg border border-bottomBorder px-2 py-2 sm:px-4 sm:py-3">
          <ShipmentsBulkActionsBar
            className="pb-0 pt-0 sm:pl-1"
            selectAllChecked={selectAllChecked}
            selectAllIndeterminate={selectAllIndeterminate}
            onSelectAllChange={handleSelectAllPage}
            onExportCsv={handleExportCsv}
            canExport={rows.length > 0}
          />
          <AllShipmentsDataTable
            pageRows={pageRows}
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
            selectedIds={selectedIds}
            onToggleRow={handleToggleRow}
            onViewRow={(id) => navigate(`/shipments/${id}`)}
            onUploadC88={() => {}}
            onSanctionWarning={() => {}}
          />
          {isFetching ? (
            <div className="px-2 pb-1 text-xs text-lightBlackOne">{t('common.loading')}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
