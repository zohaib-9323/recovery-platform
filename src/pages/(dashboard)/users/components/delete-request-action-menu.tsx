import { Fragment, useEffect, useRef, useState } from 'react'
import { Check, MoreVertical, X } from 'lucide-react'
import { createPortal } from 'react-dom'

import { MU } from '@/lib/manage-users-copy'

export type DeleteRequestAction = 'approve' | 'reject'

export type DeleteRequestActionMenuProps = {
  /** Menu entries in render order. */
  options: DeleteRequestAction[]
  onSelect: (action: DeleteRequestAction) => void
}

const MENU_WIDTH = 160

const ACTION_CONFIG: Record<
  DeleteRequestAction,
  { label: string; textClass: string; Icon: typeof Check }
> = {
  approve: { label: MU.deleteRequestApprove, textClass: 'text-green', Icon: Check },
  reject: { label: MU.deleteRequestReject, textClass: 'text-redOne', Icon: X },
}

/**
 * Same trigger + portal-dropdown pattern as `UserRowActionMenu` (which mirrors
 * admin's `CustomActionMenu`) — a circled kebab icon that opens a small menu.
 * Selecting an entry only reports the choice; the caller decides whether to
 * confirm before acting.
 */
export function DeleteRequestActionMenu({ options, onSelect }: DeleteRequestActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, caretLeft: MENU_WIDTH - 24 })

  useEffect(() => {
    if (!open) {
      return
    }

    const updatePosition = () => {
      const trigger = buttonRef.current
      if (!trigger) {
        return
      }
      const rect = trigger.getBoundingClientRect()
      const viewportPadding = 10
      const buttonCenter = rect.left + rect.width / 2
      const left = Math.max(
        viewportPadding,
        Math.min(buttonCenter - MENU_WIDTH + 24, window.innerWidth - MENU_WIDTH - viewportPadding),
      )
      setPosition({
        top: rect.bottom + 10,
        left,
        caretLeft: Math.min(MENU_WIDTH - 18, Math.max(10, buttonCenter - left - 6)),
      })
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
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  if (options.length === 0) {
    return null
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-label={MU.rowActions}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-greyNine bg-white text-black transition-colors hover:bg-greyFour"
      >
        <MoreVertical aria-hidden className="h-4 w-4" />
      </button>

      {open
        ? createPortal(
            <div
              ref={dropdownRef}
              role="menu"
              className="fixed z-[9999] rounded-md bg-white px-[14px] py-[10px] shadow-[0px_1px_10px_0px_#00000024]"
              style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            >
              <div
                aria-hidden
                className="absolute -top-[5px] h-[10px] w-[10px] rotate-45 rounded-[1px] bg-white"
                style={{ left: position.caretLeft }}
              />
              <div className="relative flex flex-col">
                {options.map((action, index) => {
                  const { label, textClass, Icon } = ACTION_CONFIG[action]
                  return (
                    <Fragment key={action}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpen(false)
                          onSelect(action)
                        }}
                        className="flex w-full items-center gap-[6px] py-[3px] text-left"
                      >
                        <Icon aria-hidden className={`h-4 w-4 shrink-0 ${textClass}`} />
                        <span className={`text-tiny font-light ${textClass}`}>{label}</span>
                      </button>
                      {index < options.length - 1 ? (
                        <span aria-hidden className="my-[9px] h-px w-full bg-greyFour" />
                      ) : null}
                    </Fragment>
                  )
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
