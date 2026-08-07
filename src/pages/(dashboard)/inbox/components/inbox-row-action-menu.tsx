'use client'

import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type InboxRowActionMenuOption = {
  label: string
  textClassName: string
  onSelect: () => Promise<void> | void
  disabled?: boolean
}

type InboxRowActionMenuProps = {
  options: InboxRowActionMenuOption[]
  /** Disables the trigger button itself (e.g. while any option's action is in flight). */
  disabled?: boolean
}

export function InboxRowActionMenu({ options, disabled = false }: InboxRowActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open || !buttonRef.current) return

    const updatePosition = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 208
      const viewportPadding = 10
      const top = rect.bottom + 8
      const left = Math.max(
        viewportPadding,
        Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - viewportPadding),
      )
      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="flex h-8 min-w-8 items-center justify-center rounded-full border border-[#E0E0E0] bg-white text-black transition-colors hover:bg-[#F8F8F8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-52 rounded-md bg-white shadow-[0px_1px_10px_0px_#00000024]"
            style={{ top: position.top, left: position.left }}
          >
            {options.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`w-full rounded-md px-4 py-3 text-left text-xs font-light hover:bg-[#F8F8F8] ${option.textClassName}`}
                onClick={async () => {
                  setOpen(false)
                  await option.onSelect()
                }}
                disabled={disabled || option.disabled}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
