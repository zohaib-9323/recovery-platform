import { useI18n } from '@/i18n/useI18n'
import { ShipmentsSearchInput } from './shipments-search-input'
import { cn } from '@/lib/utils'

export type ShipmentsPageToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  onCreateShipment?: () => void
  className?: string
}

export function ShipmentsPageToolbar({
  search,
  onSearchChange,
  onCreateShipment,
  className,
}: ShipmentsPageToolbarProps) {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        'flex flex-col justify-between space-y-2 sm:flex-row sm:items-center sm:space-y-0',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-backTwo sm:text-lg">
          {t('shipments.toolbar.title')}
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-4">
        <ShipmentsSearchInput
          value={search}
          onChange={onSearchChange}
          className="w-[200px] md:w-[300px]"
        />
        <button
          type="button"
          onClick={onCreateShipment}
          className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-yellow px-3 text-xs font-medium text-white hover:bg-yellow/90 sm:text-sm"
        >
          <span className="text-sm">+</span>
          {t('shipments.toolbar.createShipment')}
        </button>
      </div>
    </div>
  )
}
