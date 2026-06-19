import { DropdownField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
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

function getVisiblePages(currentPage: number, pageCount: number): number[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }

  if (currentPage <= 3) return [1, 2, 3, 4, 5]
  if (currentPage >= pageCount - 2)
    return [pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount]

  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
}

export function TablePagination({
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: TablePaginationProps) {
  const { t } = useI18n()
  const safePageCount = Math.max(1, pageCount)
  const safePage = Math.min(Math.max(1, page), safePageCount)
  const visiblePages = getVisiblePages(safePage, safePageCount)

  return (
    <div
      className={cn(
        'mt-2 flex flex-col gap-3 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <DropdownField
        id="table-pagination-page-size"
        layout="inline"
        label={t('table.pagination.rowsPerPage')}
        labelClassName="shrink-0 text-sm font-normal text-rp-muted"
        options={pageSizes.map((n) => ({ value: String(n), label: String(n) }))}
        value={String(pageSize)}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
      />

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          className="hidden cursor-pointer items-center gap-1 rounded border border-[#E9E9E9] px-3 py-2 text-sm text-[#313131] disabled:cursor-default disabled:opacity-50 md:flex"
          disabled={safePage === 1}
        >
          {t('table.pagination.firstPage')}
          <span className="icon-heroiconscom rotate-180 text-large text-[#626262]" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          className="flex rounded border border-[#E9E9E9] px-1.5 py-1 text-xs text-[#313131] disabled:cursor-default disabled:opacity-50 sm:px-2.5 sm:text-sm"
          disabled={safePage === 1}
        >
          <div className="flex items-center gap-0.5 text-xs sm:text-sm">
            <span className="icon-heroicon rotate-180 text-[#626262] sm:text-xl" />
            {t('table.pagination.previousPage')}
          </div>
        </button>

        {visiblePages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="rounded border border-[#E9E9E9] px-2 py-1 text-xs font-normal text-black sm:px-2.5 sm:text-sm"
              aria-label={t('table.pagination.firstPage')}
            >
              1
            </button>
            <span className="border-[#E9E9E9] px-2.5 py-1 text-[#313131]">...</span>
          </>
        )}

        {visiblePages.map((pageNo) => (
          <button
            key={pageNo}
            type="button"
            onClick={() => onPageChange(pageNo)}
            className={cn(
              'rounded border border-[#E9E9E9] px-2 py-1 text-xs font-normal text-black sm:px-2.5 sm:text-sm',
              safePage === pageNo && 'bg-yellow text-sm font-bold text-white',
            )}
            aria-label={t('table.pagination.pageOf', { page: pageNo, pageCount: safePageCount })}
          >
            {pageNo}
          </button>
        ))}

        {visiblePages[visiblePages.length - 1] < safePageCount && (
          <>
            <span className="px-1 text-xs text-rp-muted sm:text-sm">...</span>
            <button
              type="button"
              onClick={() => onPageChange(safePageCount)}
              className="rounded border border-[#E9E9E9] px-2 py-1 text-xs font-normal text-black sm:px-2.5 sm:text-sm"
              aria-label={t('table.pagination.lastPage')}
            >
              {safePageCount}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          className="flex rounded border border-[#E9E9E9] px-1.5 py-1 text-xs text-[#313131] disabled:cursor-default disabled:opacity-50 sm:px-2.5 sm:text-sm"
          disabled={safePage === safePageCount}
        >
          <div className="flex items-center gap-0.5 text-xs sm:text-sm">
            {t('table.pagination.nextPage')}
            <span className="icon-heroicon text-[#626262] sm:text-xl" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safePageCount)}
          className="hidden cursor-pointer items-center gap-1 rounded border border-[#E9E9E9] px-3 py-2 text-sm text-[#313131] disabled:cursor-default disabled:opacity-50 md:flex"
          disabled={safePage === safePageCount}
        >
          {t('table.pagination.lastPage')}
          <span className="icon-heroiconscom text-large text-[#626262]" />
        </button>
      </div>
    </div>
  )
}
