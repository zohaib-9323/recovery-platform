import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
 * highlighted selected row with a checkbox. Modeled on the same open/close/click-outside
 * architecture as InboxFilterDropdown (src/pages/(dashboard)/inbox/components/inbox-filter-dropdown.tsx).
 *
 * Picking is staged: ticking rows only edits a local draft, and nothing is reported upwards until
 * "OK" is pressed. "Cancel" (and clicking outside) throws the draft away and restores whatever was
 * last committed — for a first-time open that is the default single folder the modal pre-selects.
 */
export function FolderSelectDropdown({ value, onChange, options }: FolderSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  // Staged selection, only mirrored back to `value` on OK.
  const [draft, setDraft] = useState<string[]>(value)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const closeAndDiscard = () => {
    setOpen(false)
    setDraft(value)
  }

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        // Clicking away is a cancel, not an implicit save.
        setOpen(false)
        setDraft(value)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [value])

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
    setDraft((prev) =>
      prev.includes(optionValue) ? prev.filter((v) => v !== optionValue) : [...prev, optionValue],
    )
  }

  const handleOpenToggle = () => {
    if (open) {
      closeAndDiscard()
      return
    }
    // Start each editing session from the committed selection.
    setDraft(value)
    setOpen(true)
  }

  const handleConfirm = () => {
    onChange(draft)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-[5px] border border-rp-disabled bg-rp-border px-[15px] text-left text-sm text-rp-heading transition-colors"
        onClick={handleOpenToggle}
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
          {/* Multi-select: the list stays open so several folders can be picked before confirming. */}
          <div role="listbox" aria-multiselectable className="max-h-[260px] overflow-y-auto py-1">
            {options.map((option) => {
              const selected = draft.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm',
                    selected
                      ? 'bg-lightYellowThree font-bold text-rp-fg'
                      : 'text-rp-muted hover:bg-rp-surface',
                  )}
                  onClick={() => toggle(option.value)}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                      selected ? 'border-rp-accent bg-rp-accent' : 'border-rp-disabled bg-white',
                    )}
                    aria-hidden
                  >
                    {selected ? <Check className="size-3 text-white" /> : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-rp-disabled px-3 py-2">
            <Button variant="secondary" size="sm" onClick={closeAndDiscard}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              OK
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
