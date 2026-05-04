import { CheckboxField } from '@/components/fields'
import type { ShipmentRow } from '@/data/mock/dashboard'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
import { getShipmentStatusBadgeClassName } from '@/lib/shipment-status-badge'

const tdCell = 'p-3 text-xs font-medium text-black sm:text-sm'
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

function getVisiblePages(currentPage: number, pageCount: number): number[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1)
  if (currentPage <= 3) return [1, 2, 3, 4, 5]
  if (currentPage >= pageCount - 2) {
    return [pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
  }
  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
}

export type AllShipmentsDataTableProps = {
  pageRows: ShipmentRow[]
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  selectedIds: ReadonlySet<string>
  onToggleRow: (id: string) => void
  onViewRow?: (id: string) => void
  onUploadC88?: (id: string) => void
  onSanctionWarning?: (id: string) => void
  className?: string
}

export function AllShipmentsDataTable({
  pageRows,
  page,
  pageCount,
  onPageChange,
  selectedIds,
  onToggleRow,
  onViewRow,
  onUploadC88,
  onSanctionWarning,
  className,
}: AllShipmentsDataTableProps) {
  const { t } = useI18n()
  const safePageCount = Math.max(1, pageCount)
  const safePage = Math.min(Math.max(1, page), safePageCount)
  const visiblePages = getVisiblePages(safePage, safePageCount)

  return (
    <div
      className={cn(
        'mx-auto w-full overflow-hidden rounded-lg border border-bottomBorder',
        className,
      )}
    >
      <div className="no-scrollbar w-full overflow-x-auto xl:overflow-x-hidden">
        <table className="w-full rounded-lg bg-white">
          <thead className="bg-greyFour text-black">
            <tr className="text-left text-sm font-medium">
              <th className="p-3"></th>
              <th className="p-3 text-left text-xs font-normal capitalize sm:text-sm">
                {t('shipments.all.col.title')}
              </th>
              <th className="p-3 text-left text-xs font-normal capitalize sm:text-sm">
                {t('shipments.table.col.date')}
              </th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">
                {t('shipments.table.col.shipVia')}
              </th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">
                {t('shipments.table.col.po')}
              </th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">
                {t('shipments.all.col.status')}
              </th>
              <th className="p-3 text-left text-xs font-normal sm:text-sm">
                {t('shipments.table.col.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-bottomBorder transition hover:bg-[var(--hover-color)]',
                  row.isFlagged ? 'bg-lightRedOne' : undefined,
                )}
              >
                <td className="p-3">
                  <CheckboxField
                    aria-label={t('shipments.all.selectRow', { title: row.title })}
                    checked={selectedIds.has(row.id)}
                    onChange={() => onToggleRow(row.id)}
                  />
                </td>
                <td className="p-3 text-xs font-medium capitalize text-black sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="block max-w-[190px] truncate lg:max-w-[260px]"
                      title={row.title}
                    >
                      {row.title}
                    </span>
                    {row.isFlagged ? (
                      <span id="flagged-shipment-indicator" className="icon-flag text-redOne" />
                    ) : null}
                  </div>
                </td>
                <td className={tdCell}>
                  <span className="block truncate" title={row.date}>
                    {row.date}
                  </span>
                </td>
                <td className={cn(tdCell, 'capitalize')}>
                  <span className="block truncate" title={row.shipVia || '-'}>
                    {row.shipVia || '-'}
                  </span>
                </td>
                <td className={tdCell}>
                  <span className="block max-w-[120px] truncate lg:max-w-[160px]" title={row.po}>
                    {row.po}
                  </span>
                </td>
                <td className={cn(tdCell, 'capitalize')}>
                  <div
                    className={cn(
                      'flex w-fit max-w-[190px] items-center gap-2 rounded-md px-3 py-1 text-sm font-medium capitalize',
                      getShipmentStatusBadgeClassName(row.statusCode),
                    )}
                  >
                    <span className="icon-dot mt-0.5 text-[5px] text-current" />
                    <p className="max-w-[140px] truncate text-nowrap sm:max-w-[180px]">
                      {shipmentStatusText(row.statusCode)}
                    </p>
                    <span className="flex h-3 min-w-3 items-center justify-center rounded-full bg-current p-1 shadow-[inset_0_0_3px_1px_rgba(0,0,0,0.15)] sm:h-4 sm:min-w-4">
                      <span className="icon-confirmation text-xxxtiny text-white" />
                    </span>
                  </div>
                </td>
                <td className="p-3 text-sm font-medium text-black">
                  <div className="flex min-w-[96px] items-center gap-2">
                    {(row.screeningStatus === 'match_found' ||
                      row.sanctionsScreeningStatus === 'match_found') &&
                      (!row.sanctionDecision || row.sanctionDecision === 'none') && (
                        <button
                          type="button"
                          title={t('shipments.table.sanctionWarning')}
                          onClick={() => onSanctionWarning?.(row.id)}
                          className="h-7 min-w-7 rounded-full border border-redOne bg-lightRed transition hover:bg-redOne hover:text-white"
                        >
                          <span className="icon-alert-triangle text-xsmall text-redOne hover:text-white" />
                        </button>
                      )}
                    <button
                      type="button"
                      id="view-shipment-details"
                      className="h-7 min-w-7 rounded-full border border-bottomBorder bg-white transition disabled:opacity-50"
                      onClick={() => onViewRow?.(row.id)}
                      disabled={
                        (row.screeningStatus === 'match_found' ||
                          row.sanctionsScreeningStatus === 'match_found') &&
                        (!row.sanctionDecision || row.sanctionDecision === 'none')
                      }
                    >
                      <span className="icon-open-eye text-xsmall text-black" />
                    </button>
                    <button
                      type="button"
                      title={row.c88DocumentUrl ? 'Edit C88 document' : 'Upload C88 document'}
                      onClick={() => onUploadC88?.(row.id)}
                      disabled={
                        Boolean(row.c88DocumentUrl) ||
                        [1, 6, 7].includes(row.statusCode ?? 0) ||
                        ((row.screeningStatus === 'match_found' ||
                          row.sanctionsScreeningStatus === 'match_found') &&
                          (!row.sanctionDecision || row.sanctionDecision === 'none'))
                      }
                      className={`h-7 min-w-7 rounded-full border border-bottomBorder transition disabled:bg-disableColor ${
                        row.c88DocumentUrl ? 'bg-green' : 'bg-yellow'
                      }`}
                    >
                      <span className="icon-upload-cloud text-xsmall text-white" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {safePageCount > 1 ? (
        <div className="mt-2 flex justify-center px-2 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 bg-white">
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="hidden cursor-pointer items-center gap-1 rounded border border-paginationBorder px-3 py-2 text-sm text-backTwo disabled:cursor-default disabled:opacity-50 md:flex"
              disabled={safePage === 1}
            >
              <span className="icon-heroiconscom rotate-180 text-large text-greyThirteen" />
              {t('table.pagination.firstPage')}
            </button>
            <button
              type="button"
              onClick={() => onPageChange(safePage - 1)}
              className="flex rounded border border-paginationBorder px-1.5 py-1 text-xs text-backTwo disabled:cursor-default disabled:opacity-50 sm:px-2.5 sm:text-sm"
              disabled={safePage === 1}
            >
              <div className="flex items-center gap-0.5 text-xs sm:text-sm">
                <span className="icon-heroicon rotate-180 text-greyThirteen sm:text-xl" />
                {t('table.pagination.previousPage')}
              </div>
            </button>
            {visiblePages.map((pageNo) => (
              <button
                key={pageNo}
                type="button"
                onClick={() => onPageChange(pageNo)}
                className={cn(
                  'px-2 py-1 text-xs font-normal text-black sm:px-2.5 sm:text-sm rounded border border-paginationBorder',
                  safePage === pageNo && 'bg-yellow text-sm font-bold text-white',
                )}
              >
                {pageNo}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(safePage + 1)}
              className="flex rounded border border-paginationBorder px-1.5 py-1 text-xs text-backTwo disabled:cursor-default disabled:opacity-50 sm:px-2.5 sm:text-sm"
              disabled={safePage === safePageCount}
            >
              <div className="flex items-center gap-0.5 text-xs sm:text-sm">
                {t('table.pagination.nextPage')}
                <span className="icon-heroicon text-greyThirteen sm:text-xl" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => onPageChange(safePageCount)}
              className="hidden cursor-pointer items-center gap-1 rounded border border-paginationBorder px-3 py-2 text-sm text-backTwo disabled:cursor-default disabled:opacity-50 md:flex"
              disabled={safePage === safePageCount}
            >
              {t('table.pagination.lastPage')}
              <span className="icon-heroiconscom text-large text-greyThirteen" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
