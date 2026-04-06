import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownField } from '@/components/fields'
import { cn } from '@/lib/utils'

export type TablePaginationProps = {
  page: number
  pageCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  className?: string
}

const pageSizes = [5, 10, 25]

export function TablePagination({
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: TablePaginationProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 bg-rp-surface/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <DropdownField
        id="table-pagination-page-size"
        layout="inline"
        label="Rows per page"
        labelClassName="shrink-0 text-sm font-normal text-rp-muted"
        options={pageSizes.map((n) => ({ value: String(n), label: String(n) }))}
        value={String(pageSize)}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-rp-muted">
          Page {page} of {pageCount}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page >= pageCount}
            onClick={() => onPageChange(pageCount)}
            aria-label="Last page"
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
