import { useEffect, useRef, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

import { formatDisplayDate, startOfDay } from './date-range-utils'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

type DateCell = { date: Date; inMonth: boolean }

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function buildMonthGrid(viewDate: Date): DateCell[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startWeekday + 1
    if (dayNumber < 1) {
      return { date: new Date(year, month - 1, daysInPrevMonth + dayNumber), inMonth: false }
    }
    if (dayNumber > daysInMonth) {
      return { date: new Date(year, month + 1, dayNumber - daysInMonth), inMonth: false }
    }
    return { date: new Date(year, month, dayNumber), inMonth: true }
  })
}

export type DateFieldPickerProps = {
  label: string
  placeholder: string
  value: Date | null
  onChange: (date: Date) => void
  minDate: Date
  maxDate: Date
}

export function DateFieldPicker({
  label,
  placeholder,
  value,
  onChange,
  minDate,
  maxDate,
}: DateFieldPickerProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => value ?? minDate)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const handleToggle = () => {
    const next = !open
    if (next) setViewDate(value ?? minDate)
    setOpen(next)
  }

  const boundedMin = startOfDay(minDate)
  const boundedMax = startOfDay(maxDate)
  const isDisabled = (date: Date) => date < boundedMin || date > boundedMax

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const cells = buildMonthGrid(viewDate)
  const formattedValue = value ? formatDisplayDate(value) : null

  return (
    <div className="flex flex-1 flex-col gap-2.5">
      <span className="text-xs font-semibold text-rp-fg">{label}</span>
      <div ref={wrapperRef} className="relative w-full">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between rounded-[5px] border-rp-disabled bg-rp-border px-[15px] text-left text-sm font-normal text-rp-muted hover:bg-rp-border"
          onClick={handleToggle}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span>{formattedValue ?? placeholder}</span>
          <CalendarIcon className="size-[18px] shrink-0 text-rp-muted" aria-hidden />
        </Button>

        {open ? (
          <div className="absolute left-0 z-30 mt-2 w-[290px] rounded-xl border border-rp-border bg-white pb-5 shadow-[0px_2px_19px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between px-4 py-3.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('imports.startModal.dateRange.previousMonth')}
                className="h-7 w-7 rounded-full p-0"
                onClick={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs font-medium text-rp-fg">{monthLabel}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('imports.startModal.dateRange.nextMonth')}
                className="h-7 w-7 rounded-full p-0"
                onClick={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 justify-items-center gap-y-1 px-2">
              {WEEKDAY_LABELS.map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  className="flex size-9 items-center justify-center text-sm font-medium text-rp-muted"
                >
                  {day}
                </div>
              ))}
              {cells.map(({ date, inMonth }) => {
                const disabled = isDisabled(date)
                const selected = isSameDay(date, value)
                return (
                  <Button
                    key={date.toISOString()}
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    onClick={() => {
                      onChange(date)
                      setOpen(false)
                    }}
                    className={cn(
                      'h-9 w-9 rounded-full p-0 text-sm font-normal',
                      selected
                        ? 'bg-rp-accent text-white hover:bg-rp-accent'
                        : inMonth
                          ? 'text-rp-fg'
                          : 'text-rp-disabled',
                      disabled && 'opacity-40',
                    )}
                  >
                    {date.getDate()}
                  </Button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
