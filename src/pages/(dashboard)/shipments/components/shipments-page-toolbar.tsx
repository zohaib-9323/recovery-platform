import { MS } from '@/lib/manage-shipments-copy'
import { cn } from '@/lib/utils'

import { ShipmentsSearchInput } from './shipments-search-input'

export type ShipmentsPageToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  onCreateShipment?: () => void
  /** When `0`, create is disabled like trade-harmonizer shipment limit. Omit to always allow. */
  remainingShipmentLimit?: number | null
  className?: string
}

export function ShipmentsPageToolbar({
  search,
  onSearchChange,
  className,
}: ShipmentsPageToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:space-x-4',
        className,
      )}
    >
      <div className="flex flex-row items-center gap-5">
        <div className="min-w-fit text-lg font-semibold text-black md:text-lg">
          {MS.manageShipments}
        </div>
      </div>
      <div className="flex flex-row items-center gap-3">
        <ShipmentsSearchInput
          value={search}
          onChange={onSearchChange}
          padding="py-2.5"
          className="w-[160px] sm:w-[230px] md:w-[275px] lg:w-[350px]"
          inputWidthClass="w-full"
        />
        {/* <button
          type="button"
          id="create-shipment-btn"
          disabled={limitReached}
          onClick={() => {
            if (limitReached) return
            onCreateShipment?.()
          }}
          className="dashboard flex items-center justify-center gap-1 rounded-[4px] bg-yellow p-2.5 disabled:bg-disableColor"
        >
          <IoMdAdd color="white" />
          <span className="text-nowrap text-xs font-light text-whiteOne md:text-sm">
            {MS.createShipment}
          </span>
        </button> */}
      </div>
    </div>
  )
}
