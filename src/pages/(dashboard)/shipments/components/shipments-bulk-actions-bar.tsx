import { CsvExportButton } from '@/components/buttons'
import { CustomCheckboxShipment } from '@/components/fields/preset/custom-checkbox-shipment'
import { MS } from '@/lib/manage-shipments-copy'
import { cn } from '@/lib/utils'

import type { ShipmentListCsvRow } from './shipments-csv-types'

export type ShipmentsBulkActionsBarProps = {
  isAllSelected: boolean
  onSelectAll: () => void
  csvData: ShipmentListCsvRow[]
  onGenerateCsv: () => void
  isExportDisabled: boolean
  className?: string
}

export function ShipmentsBulkActionsBar({
  isAllSelected,
  onSelectAll,
  csvData,
  onGenerateCsv,
  isExportDisabled,
  className,
}: ShipmentsBulkActionsBarProps) {
  return (
    <div className={cn('flex flex-row items-center justify-between', className)}>
      <div className="flex items-center space-x-2 px-3">
        <CustomCheckboxShipment isChecked={isAllSelected} onChange={onSelectAll} />
        <span className="text-sm font-light text-black md:text-base">{MS.selectAll}</span>
      </div>
      <CsvExportButton
        isDisabled={isExportDisabled}
        data={csvData}
        moduleName="Manage-Shipments(Recovery)"
        className="export-btn"
        onClick={onGenerateCsv}
      />
    </div>
  )
}
