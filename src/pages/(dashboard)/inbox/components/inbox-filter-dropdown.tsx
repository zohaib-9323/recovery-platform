'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type FilterValue = 'all' | 'processed' | 'quarantined'
type FilterOption = { value: FilterValue; label: string }

type InboxFilterDropdownProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  options: FilterOption[]
}

export function InboxFilterDropdown({ value, onChange, options }: InboxFilterDropdownProps) {
  const [open, setOpen] = useState(false)
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

  const selectedLabel = options.find((option) => option.value === value)?.label ?? value

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-[10px] border bg-white px-3 text-left text-sm text-black transition-colors',
          open ? 'border-rp-accent' : 'border-bottomBorder',
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-blackFive transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-2 rounded-md bg-white shadow-[0px_1px_10px_0px_#00000024]">
          <div role="listbox" className="py-1.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'w-full px-4 py-3 text-left text-sm hover:bg-[var(--hover-color)]',
                  option.value === value ? 'text-rp-accent' : 'text-black',
                )}
                onClick={() => {
                  setOpen(false)
                  if (option.value !== value) onChange(option.value)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
