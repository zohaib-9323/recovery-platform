import { useI18n } from '@/i18n/useI18n'

import { formatDisplayDate } from './date-range-utils'
import { InfoBanner } from './info-banner'

export type ReviewImportStepProps = {
  folderLabel: string
  startDate: Date
  endDate: Date
  daysSelected: number
}

export function ReviewImportStep({
  folderLabel,
  startDate,
  endDate,
  daysSelected,
}: ReviewImportStepProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3">
      <InfoBanner>
        {t('imports.startModal.review.summary', {
          folder: folderLabel,
          startDate: formatDisplayDate(startDate),
          endDate: formatDisplayDate(endDate),
        })}
      </InfoBanner>
      <p className="text-xs text-rp-muted">
        {t('imports.startModal.review.hint', { days: daysSelected })}
      </p>
    </div>
  )
}
