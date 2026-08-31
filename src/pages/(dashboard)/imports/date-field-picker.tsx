import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

import { formatDisplayDate, startOfDay } from './date-range-utils'

/** Gap between the trigger and the panel, and the breathing room kept at the viewport edge. */
const PANEL_GAP = 8
const VIEWPORT_MARGIN = 8
const PANEL_WIDTH = 290
/** Below this, dropping down looks cramped and we flip above the trigger instead. */
const MIN_DROP_DOWN_SPACE = 340

type PanelPosition = {
  left: number
  /** Exactly one of top/bottom is set, depending on whether the panel drops down or flips up. */
  top?: number
  bottom?: number
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABELS = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleDateString('en-US', { month: 'long' }),
)

type DateCell = { date: Date; inMonth: boolean }

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return min
  if (date > max) return max
  return date
}

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
  const boundedMin = startOfDay(minDate)
  const boundedMax = startOfDay(maxDate)
  const defaultViewDate = () => value ?? clampDate(startOfDay(new Date()), boundedMin, boundedMax)
  const [viewDate, setViewDate] = useState(defaultViewDate)
  const [position, setPosition] = useState<PanelPosition | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Positioned via a portal with `fixed` coordinates rather than absolutely inside the
  // trigger — see FolderSelectDropdown for why: StartImportModal's Popup is
  // `max-h-[90vh] overflow-y-auto`, and an absolutely-positioned panel there grows the
  // dialog's own scroll area instead of floating above its content.
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_GAP - VIEWPORT_MARGIN
    const spaceAbove = rect.top - PANEL_GAP - VIEWPORT_MARGIN
    const flipUp = spaceBelow < MIN_DROP_DOWN_SPACE && spaceAbove > spaceBelow
    const maxLeft = window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN

    setPosition({
      left: Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxLeft)),
      top: flipUp ? undefined : rect.bottom + PANEL_GAP,
      bottom: flipUp ? window.innerHeight - rect.top + PANEL_GAP : undefined,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      return
    }
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) {
      return
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (wrapperRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    // Capture phase so the panel follows the trigger when any ancestor scrolls, not just the window.
    const onReposition = () => updatePosition()

    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, updatePosition])

  const handleToggle = () => {
    const next = !open
    if (next) setViewDate(defaultViewDate())
    setOpen(next)
  }

  const isDisabled = (date: Date) => date < boundedMin || date > boundedMax

  const cells = buildMonthGrid(viewDate)
  const formattedValue = value ? formatDisplayDate(value) : null

  const minYear = boundedMin.getFullYear()
  const maxYear = boundedMax.getFullYear()
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index)

  const currentYear = viewDate.getFullYear()
  const monthMin = currentYear === minYear ? boundedMin.getMonth() : 0
  const monthMax = currentYear === maxYear ? boundedMax.getMonth() : 11
  const monthOptions = Array.from(
    { length: monthMax - monthMin + 1 },
    (_, index) => monthMin + index,
  )

  const handleMonthChange = (month: number) => {
    setViewDate(new Date(currentYear, month, 1))
  }

  const handleYearChange = (year: number) => {
    const nextMonthMin = year === minYear ? boundedMin.getMonth() : 0
    const nextMonthMax = year === maxYear ? boundedMax.getMonth() : 11
    const clampedMonth = Math.min(Math.max(viewDate.getMonth(), nextMonthMin), nextMonthMax)
    setViewDate(new Date(year, clampedMonth, 1))
  }

  const goToAdjacentMonth = (offset: number) => {
    const naive = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1)
    const year = Math.min(Math.max(naive.getFullYear(), minYear), maxYear)
    const nextMonthMin = year === minYear ? boundedMin.getMonth() : 0
    const nextMonthMax = year === maxYear ? boundedMax.getMonth() : 11
    const month = Math.min(Math.max(naive.getMonth(), nextMonthMin), nextMonthMax)
    setViewDate(new Date(year, month, 1))
  }

  const panel = (
    <div
      ref={panelRef}
      style={{
        left: position?.left ?? 0,
        top: position?.top,
        bottom: position?.bottom,
        width: PANEL_WIDTH,
      }}
      className="fixed z-[60] rounded-xl border border-rp-border bg-white pb-5 shadow-[0px_2px_19px_rgba(0,0,0,0.1)]"
    >
      <div className="flex items-center justify-between gap-1 px-4 py-3.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('imports.startModal.dateRange.previousMonth')}
          className="h-7 w-7 shrink-0 rounded-full p-0"
          onClick={() => goToAdjacentMonth(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-1">
          <select
            aria-label={t('imports.startModal.dateRange.selectMonth')}
            value={viewDate.getMonth()}
            onChange={(event) => handleMonthChange(Number(event.target.value))}
            className="rounded-md border-none bg-transparent py-0.5 pl-1 pr-0.5 text-xs font-medium text-rp-fg outline-none hover:bg-rp-border focus-visible:ring-1 focus-visible:ring-rp-accent"
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {MONTH_LABELS[month]}
              </option>
            ))}
          </select>
          <select
            aria-label={t('imports.startModal.dateRange.selectYear')}
            value={viewDate.getFullYear()}
            onChange={(event) => handleYearChange(Number(event.target.value))}
            className="rounded-md border-none bg-transparent py-0.5 pl-1 pr-0.5 text-xs font-medium text-rp-fg outline-none hover:bg-rp-border focus-visible:ring-1 focus-visible:ring-rp-accent"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('imports.startModal.dateRange.nextMonth')}
          className="h-7 w-7 shrink-0 rounded-full p-0"
          onClick={() => goToAdjacentMonth(1)}
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
  )

  return (
    <div className="flex flex-1 flex-col gap-2.5">
      <span className="text-xs font-semibold text-rp-fg">{label}</span>
      <div ref={wrapperRef} className="relative w-full">
        <Button
          ref={triggerRef}
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

        {open ? createPortal(panel, document.body) : null}
      </div>
    </div>
  )
}
