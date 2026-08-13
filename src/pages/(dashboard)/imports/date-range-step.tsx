import { useMemo } from 'react'

import { useI18n } from '@/i18n/useI18n'

import {
  addDays,
  getDaysSelected,
  LOOKBACK_YEARS,
  MAX_RANGE_DAYS,
  startOfDay,
} from './date-range-utils'
import { DateFieldPicker } from './date-field-picker'
import { InfoBanner } from './info-banner'

export type DateRangeValue = {
  startDate: Date | null
  endDate: Date | null
}

type DateRangeStepProps = {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

export function DateRangeStep({ value, onChange }: DateRangeStepProps) {
  const { t } = useI18n()
  const { startDate, endDate } = value

  const today = useMemo(() => startOfDay(new Date()), [])
  const earliestDate = useMemo(
    () => new Date(today.getFullYear() - LOOKBACK_YEARS, today.getMonth(), today.getDate()),
    [today],
  )

  const startMinDate = endDate
    ? new Date(Math.max(earliestDate.getTime(), addDays(endDate, -MAX_RANGE_DAYS).getTime()))
    : earliestDate
  const startMaxDate = endDate ? endDate : today

  const endMinDate = startDate ?? earliestDate
  const endMaxDate = startDate
    ? new Date(Math.min(addDays(startDate, MAX_RANGE_DAYS).getTime(), today.getTime()))
    : today

  const daysSelected = startDate && endDate ? getDaysSelected(startDate, endDate) : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2.5">
        <DateFieldPicker
          label={t('imports.startModal.dateRange.startDateLabel')}
          placeholder={t('imports.startModal.dateRange.selectDate')}
          value={startDate}
          onChange={(date) =>
            onChange({ startDate: date, endDate: endDate && endDate < date ? null : endDate })
          }
          minDate={startMinDate}
          maxDate={startMaxDate}
        />
        <DateFieldPicker
          label={t('imports.startModal.dateRange.endDateLabel')}
          placeholder={t('imports.startModal.dateRange.selectDate')}
          value={endDate}
          onChange={(date) => onChange({ startDate, endDate: date })}
          minDate={endMinDate}
          maxDate={endMaxDate}
        />
      </div>

      {daysSelected === null ? (
        <p className="text-xs leading-[18px] text-rp-muted">
          {t('imports.startModal.dateRange.hint', { years: LOOKBACK_YEARS })}
        </p>
      ) : (
        <>
          <div className="flex w-fit items-center rounded-full bg-rp-accent px-3.5 py-2">
            <span className="text-xs font-medium text-white">
              {t('imports.startModal.dateRange.daysSelected', {
                count: daysSelected,
                max: MAX_RANGE_DAYS,
              })}
            </span>
          </div>

          <InfoBanner>{t('imports.startModal.dateRange.duplicateWarning')}</InfoBanner>
        </>
      )}
    </div>
  )
}
