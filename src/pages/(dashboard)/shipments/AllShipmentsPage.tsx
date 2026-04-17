import { useCallback, useMemo, useState } from 'react'

import { AllShipmentsDataTable } from '@/pages/(dashboard)/shipments/components/all-shipments-data-table'
import { ShipmentsBulkActionsBar } from '@/pages/(dashboard)/shipments/components/shipments-bulk-actions-bar'
import { ShipmentsPageToolbar } from '@/pages/(dashboard)/shipments/components/shipments-page-toolbar'
import { allShipmentsRows } from '@/data/mock/all-shipments'
import type { ShipmentRow } from '@/data/mock/dashboard'
import { buildShipmentsCsv, downloadTextFile } from '@/lib/csv'

function filterShipments(rows: ShipmentRow[], query: string): ShipmentRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.po.toLowerCase().includes(q) ||
      r.shipVia.toLowerCase().includes(q) ||
      r.date.toLowerCase().includes(q),
  )
}

export function AllShipmentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const filteredRows = useMemo(() => filterShipments(allShipmentsRows, search), [search])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, safePage, pageSize])

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
    const source = ids.size > 0 ? filteredRows.filter((r) => ids.has(r.id)) : filteredRows
    if (source.length === 0) return
    const csv = buildShipmentsCsv(source)
    downloadTextFile(csv, `shipments-export-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [filteredRows, selectedIds])

  const handlePageSizeChange = useCallback((n: number) => {
    setPageSize(n)
    setPage(1)
  }, [])

  return (
    <div className="flex flex-col gap-0">
      <ShipmentsPageToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        onAddShipment={() => {
          /* wire to modal / route when ready */
        }}
      />
      <ShipmentsBulkActionsBar
        className="pt-2"
        selectAllChecked={selectAllChecked}
        selectAllIndeterminate={selectAllIndeterminate}
        onSelectAllChange={handleSelectAllPage}
        onExportCsv={handleExportCsv}
        canExport={filteredRows.length > 0}
      />
      <div className="pt-4">
        <AllShipmentsDataTable
          pageRows={pageRows}
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          selectedIds={selectedIds}
          onToggleRow={handleToggleRow}
        />
      </div>
    </div>
  )
}
