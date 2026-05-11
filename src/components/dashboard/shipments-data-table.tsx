import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'

import { TablePagination } from '@/components/dashboard/table-pagination'
import { TableFooter, TableHeader, TableListing, TableShell } from '@/components/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ShipmentRow } from '@/data/mock/dashboard'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

const thCell = 'px-4 py-3 text-left text-xs font-semibold text-rp-muted sm:px-6'

export type ShipmentsDataTableProps = {
  title: string
  viewAllLabel?: string
  rows: ShipmentRow[]
  className?: string
}

export function ShipmentsDataTable({
  title,
  viewAllLabel = 'View All',
  rows,
  className,
}: ShipmentsDataTableProps) {
  const { t } = useI18n()
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, safePage, pageSize])

  return (
    <Card padding="none" className={cn('overflow-hidden border-rp-border shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 py-4">
        <h2 className="text-lg font-semibold text-rp-fg">{title}</h2>
        <button type="button" className="text-sm font-semibold text-rp-accent hover:underline">
          {viewAllLabel}
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <TableShell>
          <TableHeader>
            <tr>
              <th className={thCell}>{t('shipments.table.col.title')}</th>
              <th className={thCell}>{t('shipments.table.col.date')}</th>
              <th className={thCell}>{t('shipments.table.col.po')}</th>
              <th className={thCell}>{t('shipments.table.col.shipVia')}</th>
              <th className={cn(thCell, 'text-right')}>{t('shipments.table.col.actions')}</th>
            </tr>
          </TableHeader>
          <TableListing>
            {pageRows.map((row) => (
              <tr key={row.id} className="hover:bg-rp-surface/40">
                <td className="px-6 py-3 font-medium text-rp-fg">{row.title}</td>
                <td className="px-6 py-3 text-rp-muted">{row.date}</td>
                <td className="px-6 py-3 text-rp-fg">{row.po}</td>
                <td className="px-6 py-3 text-rp-muted">{row.shipVia}</td>
                <td className="px-6 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('common.view')}
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
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n)
              setPage(1)
            }}
          />
        </TableFooter>
      </CardContent>
    </Card>
  )
}
