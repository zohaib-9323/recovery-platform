import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

/** Gap between the trigger and the panel, and the breathing room kept at the viewport edge. */
const PANEL_GAP = 8
const VIEWPORT_MARGIN = 8
/** Preferred panel height; shrunk further when the viewport is short. */
const PANEL_MAX_HEIGHT = 320
/** Below this, dropping down looks cramped and we flip above the trigger instead. */
const MIN_DROP_DOWN_SPACE = 180

type PanelPosition = {
  left: number
  width: number
  /** Exactly one of top/bottom is set, depending on whether the panel drops down or flips up. */
  top?: number
  bottom?: number
  maxHeight: number
}

/**
 * Custom listbox (not the native-`<select>`-backed DropdownField) because the design calls for a
 * highlighted selected row with a checkbox. Modeled on the same open/close/click-outside
 * architecture as InboxFilterDropdown (src/pages/(dashboard)/inbox/components/inbox-filter-dropdown.tsx).
 *
 * Picking is staged: ticking rows only edits a local draft, and nothing is reported upwards until
 * "OK" is pressed. "Cancel" (and clicking outside) throws the draft away and restores whatever was
 * last committed — for a first-time open that is the default single folder the modal pre-selects.
 *
 * The panel is rendered in a portal with fixed positioning rather than absolutely inside the
 * trigger. Inside a scrollable dialog (StartImportModal's Popup is `max-h-[90vh] overflow-y-auto`)
 * an absolute panel grows the dialog's scroll area, so the user gets a dialog scrollbar stacked
 * next to the list's own — and the panel is clipped by the dialog's `overflow-x-hidden`. Portalling
 * keeps the panel out of that scroll container, so only the list itself ever scrolls.
 */
export function FolderSelectDropdown({ value, onChange, options }: FolderSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  // Staged selection, only mirrored back to `value` on OK.
  const [draft, setDraft] = useState<string[]>(value)
  const [position, setPosition] = useState<PanelPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const closeAndDiscard = () => {
    setOpen(false)
    setDraft(value)
  }

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_GAP - VIEWPORT_MARGIN
    const spaceAbove = rect.top - PANEL_GAP - VIEWPORT_MARGIN
    const flipUp = spaceBelow < MIN_DROP_DOWN_SPACE && spaceAbove > spaceBelow
    const available = flipUp ? spaceAbove : spaceBelow

    setPosition({
      left: rect.left,
      width: rect.width,
      top: flipUp ? undefined : rect.bottom + PANEL_GAP,
      bottom: flipUp ? window.innerHeight - rect.top + PANEL_GAP : undefined,
      // Never taller than the space we actually have, so the panel itself never needs to scroll.
      maxHeight: Math.max(160, Math.min(PANEL_MAX_HEIGHT, available)),
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
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }
      // Clicking away is a cancel, not an implicit save.
      setOpen(false)
      setDraft(value)
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
  }, [open, value, updatePosition])

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

  const panel = (
    <div
      ref={panelRef}
      style={{
        left: position?.left ?? 0,
        width: position?.width ?? 0,
        top: position?.top,
        bottom: position?.bottom,
        maxHeight: position?.maxHeight ?? PANEL_MAX_HEIGHT,
      }}
      className="fixed z-[60] flex flex-col overflow-hidden rounded-[10px] border border-rp-disabled bg-white shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_rgba(0,0,0,0.1)]"
    >
      {/* Multi-select: the list stays open so several folders can be picked before confirming. */}
      <div
        role="listbox"
        aria-multiselectable
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
      >
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

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-rp-disabled px-3 py-2">
        <Button variant="secondary" size="sm" onClick={closeAndDiscard}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm}>
          OK
        </Button>
      </div>
    </div>
  )

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
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

      {open ? createPortal(panel, document.body) : null}
    </div>
  )
}
