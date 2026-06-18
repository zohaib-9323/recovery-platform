import ReactPaginate from 'react-paginate'

import { MS } from '@/lib/manage-shipments-copy'

export type CustomPaginationProps = {
  totalPages: number
  onPageChange: (page: number) => void
  currentPage?: number
}

export function CustomPagination({ totalPages, onPageChange, currentPage }: CustomPaginationProps) {
  const handlePageClick = (data: { selected: number }) => {
    onPageChange(data.selected + 1)
  }

  return (
    <div className="mt-2 flex justify-center" id="pagination-controls">
      <div className="flex items-center gap-2 bg-white">
        <button
          type="button"
          onClick={() => handlePageClick({ selected: 0 })}
          className="hidden cursor-pointer items-center gap-1 rounded border border-paginationBorder px-3 py-2 text-sm text-backTwo disabled:cursor-default disabled:opacity-50 md:flex"
          disabled={currentPage === 1}
        >
          <span className="icon-heroiconscom rotate-180 text-large text-greyThirteen" />
          {MS.first}
        </button>

        <ReactPaginate
          forcePage={(currentPage ?? 1) - 1}
          previousLabel={
            <div className="flex items-center gap-0.5 text-xs sm:text-sm">
              <span className="icon-heroicon rotate-180 text-greyThirteen sm:text-xl" />
              {MS.back}
            </div>
          }
          nextLabel={
            <div className="flex items-center gap-0.5 text-xs sm:text-sm">
              {MS.next}
              <span className="icon-heroicon text-greyThirteen sm:text-xl" />
            </div>
          }
          breakLabel={'...'}
          breakClassName="px-2.5 py-1 text-backTwo border-paginationBorder"
          pageCount={totalPages}
          marginPagesDisplayed={1}
          pageRangeDisplayed={2}
          onPageChange={handlePageClick}
          containerClassName="flex items-center gap-1 sm:gap-2"
          pageClassName="px-2 sm:px-2.5 py-1 rounded text-black text-xs sm:text-sm font-normal border border-paginationBorder"
          activeClassName="bg-yellow text-white text-sm font-bold text-sm"
          previousClassName="px-1.5 sm:px-2.5 py-1 text-xs sm:text-sm text-backTwo rounded border border-paginationBorder flex"
          nextClassName="px-1.5 sm:px-2.5 py-1 text-xs sm:text-sm text-backTwo rounded border border-paginationBorder flex"
          disabledClassName="opacity-50 cursor-not-allowed"
          renderOnZeroPageCount={null}
        />

        <button
          type="button"
          onClick={() => handlePageClick({ selected: totalPages - 1 })}
          className="hidden cursor-pointer items-center gap-1 rounded border border-paginationBorder px-3 py-2 text-sm text-backTwo disabled:cursor-default disabled:opacity-50 md:flex"
          disabled={currentPage === totalPages}
        >
          {MS.last}
          <span className="icon-heroiconscom text-large text-greyThirteen" />
        </button>
      </div>
    </div>
  )
}
