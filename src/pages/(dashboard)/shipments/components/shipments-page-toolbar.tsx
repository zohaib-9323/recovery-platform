import { Plus } from 'lucide-react'

import { PrimaryButton } from '@/components/buttons'
import { useI18n } from '@/i18n/useI18n'
import { ShipmentsSearchInput } from './shipments-search-input'
import { cn } from '@/lib/utils'

export type ShipmentsPageToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  onAddShipment?: () => void
  className?: string
}

export function ShipmentsPageToolbar({
  search,
  onSearchChange,
  onAddShipment,
  className,
}: ShipmentsPageToolbarProps) {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        'flex flex-col gap-4  pb-6 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <h1 className="text-xl font-bold text-rp-heading sm:text-2xl">
        {t('shipments.toolbar.title')}
      </h1>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-0 sm:flex-1 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <ShipmentsSearchInput
          value={search}
          onChange={onSearchChange}
          className="sm:max-w-xs md:max-w-md"
        />
        <PrimaryButton
          type="button"
          className="h-11 shrink-0 gap-2 px-4 sm:px-5"
          onClick={onAddShipment}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {t('shipments.toolbar.addShipment')}
        </PrimaryButton>
      </div>
    </div>
  )
}
