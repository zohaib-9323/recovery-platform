import { CsvExportButton } from '@/components/buttons'
import { CheckboxField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

export type ShipmentsBulkActionsBarProps = {
  selectAllChecked: boolean
  selectAllIndeterminate: boolean
  onSelectAllChange: (checked: boolean) => void
  onExportCsv: () => void
  canExport?: boolean
  className?: string
}

export function ShipmentsBulkActionsBar({
  selectAllChecked,
  selectAllIndeterminate,
  onSelectAllChange,
  onExportCsv,
  canExport = true,
  className,
}: ShipmentsBulkActionsBarProps) {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        'flex flex-col gap-3  bg-white py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <CheckboxField
        id="shipments-select-all"
        label={t('shipments.bulk.selectAll')}
        checked={selectAllChecked}
        indeterminate={selectAllIndeterminate}
        onChange={(e) => onSelectAllChange(e.target.checked)}
      />
      <CsvExportButton
        buttonText={t('shipments.bulk.exportCsv')}
        onClick={onExportCsv}
        disabled={!canExport}
      />
    </div>
  )
}
