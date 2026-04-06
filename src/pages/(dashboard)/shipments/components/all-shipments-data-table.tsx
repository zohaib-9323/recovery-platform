import { Eye } from 'lucide-react'

import { TablePagination } from '@/components/dashboard/table-pagination'
import { TableFooter, TableHeader, TableListing, TableShell } from '@/components/table'
import { CheckboxField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ShipmentRow } from '@/data/mock/dashboard'
import { cn } from '@/lib/utils'

const thCell = 'bg-[#F1F1F1] px-4 py-3 text-left text-xs font-semibold text-[#666666] sm:px-6'

export type AllShipmentsDataTableProps = {
  pageRows: ShipmentRow[]
  page: number
  pageCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  selectedIds: ReadonlySet<string>
  onToggleRow: (id: string) => void
  className?: string
}

export function AllShipmentsDataTable({
  pageRows,
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  onToggleRow,
  className,
}: AllShipmentsDataTableProps) {
  return (
    <Card padding="none" className={cn('overflow-hidden border-rp-border shadow-sm', className)}>
      <CardContent className="p-0">
        <TableShell>
          <TableHeader>
            <tr>
              <th className={cn(thCell, 'w-10 sm:w-12')} aria-label="Select" />
              <th className={thCell}>Shipment Title</th>
              <th className={thCell}>Date</th>
              <th className={thCell}>Ship Via</th>
              <th className={thCell}>PO #</th>
              <th className={cn(thCell, 'text-right')}>Actions</th>
            </tr>
          </TableHeader>
          <TableListing>
            {pageRows.map((row) => (
              <tr key={row.id} className="hover:bg-rp-surface/40">
                <td className="px-4 py-3 sm:px-6">
                  <CheckboxField
                    aria-label={`Select ${row.title}`}
                    checked={selectedIds.has(row.id)}
                    onChange={() => onToggleRow(row.id)}
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-rp-fg sm:px-6">{row.title}</td>
                <td className="px-4 py-3 text-sm text-rp-muted sm:px-6">{row.date}</td>
                <td className="px-4 py-3 text-sm text-rp-muted sm:px-6">{row.shipVia}</td>
                <td className="px-4 py-3 text-sm text-rp-fg sm:px-6">{row.po}</td>
                <td className="px-4 py-3 text-right sm:px-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="View"
                  >
                    <Eye className="h-4 w-4 text-rp-icon" />
                  </Button>
                </td>
              </tr>
            ))}
          </TableListing>
        </TableShell>
        <TableFooter>
          <TablePagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </TableFooter>
      </CardContent>
    </Card>
  )
}
