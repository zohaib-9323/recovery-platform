import { Download } from 'lucide-react'

import { CheckboxField } from '@/components/fields'
import { cn } from '@/lib/utils'

export type ShipmentsBulkActionsBarProps = {
  selectAllChecked: boolean
  selectAllIndeterminate: boolean
  onSelectAllChange: (checked: boolean) => void
  onExportCsv: () => void
  className?: string
}

export function ShipmentsBulkActionsBar({
  selectAllChecked,
  selectAllIndeterminate,
  onSelectAllChange,
  onExportCsv,
  className,
}: ShipmentsBulkActionsBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3  bg-white py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <CheckboxField
        id="shipments-select-all"
        label="Select All"
        checked={selectAllChecked}
        indeterminate={selectAllIndeterminate}
        onChange={(e) => onSelectAllChange(e.target.checked)}
      />
      <button
        type="button"
        onClick={onExportCsv}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
      >
        <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
        Export CSV
      </button>
    </div>
  )
}
