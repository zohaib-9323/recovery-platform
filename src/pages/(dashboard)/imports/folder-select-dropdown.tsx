import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export type FolderOption = { value: string; label: string }

type FolderSelectDropdownProps = {
  /** Selected folder ids. Multiple folders can be scanned in one import job. */
  value: string[]
  onChange: (value: string[]) => void
  options: FolderOption[]
}

/**
 * Custom listbox (not the native-`<select>`-backed DropdownField) because the design calls for a
 * highlighted selected row with a checkmark. Modeled on the same open/close/click-outside
 * architecture as InboxFilterDropdown (src/pages/(dashboard)/inbox/components/inbox-filter-dropdown.tsx).
 */
export function FolderSelectDropdown({ value, onChange, options }: FolderSelectDropdownProps) {
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

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label)

  // Keep the trigger readable when many folders are picked.
  const selectedLabel =
    selectedLabels.length === 0
      ? 'Select folders'
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels[0]}, ${selectedLabels[1]} +${selectedLabels.length - 2} more`

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    )
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-[5px] border border-rp-disabled bg-rp-border px-[15px] text-left text-sm text-rp-heading transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate" title={selectedLabels.join(', ')}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-rp-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-[10px] border border-rp-disabled bg-white shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_rgba(0,0,0,0.1)]">
          {/* Multi-select: the list stays open so several folders can be picked. */}
          <div role="listbox" aria-multiselectable className="max-h-[260px] overflow-y-auto py-1">
            {options.map((option) => {
              const selected = value.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm',
                    selected
                      ? 'bg-lightYellowThree font-bold text-rp-fg'
                      : 'text-rp-muted hover:bg-rp-surface',
                  )}
                  onClick={() => toggle(option.value)}
                >
                  {option.label}
                  {selected ? <Check className="h-4 w-4 text-rp-accent" aria-hidden /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
