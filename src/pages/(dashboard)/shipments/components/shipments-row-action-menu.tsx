'use client'

import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/i18n/useI18n'

type ShipmentsRowActionMenuProps = {
  options: {
    id: string
    label: string
    tone?: 'default' | 'danger'
    onSelect?: () => void
    icon?: string
    iconSize?: string
    textColor?: string
  }[]
}

export function ShipmentsRowActionMenu({ options }: ShipmentsRowActionMenuProps) {
  const { t } = useI18n()
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
        className="flex h-6 min-w-6 items-center justify-center rounded-full border border-greyNine bg-white transition-colors hover:bg-lightGreyTwo"
        aria-label={t('inbox.actions.openMenu')}
      >
        <MoreVertical className="h-3.5 min-w-3" />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-52 rounded-md bg-white shadow-[0px_1px_10px_0px_#00000024]"
            style={{ top: position.top, left: position.left }}
          >
            <div className="no-scrollbar pb-1.5 pt-2">
              {options.map((option, index) => {
                const textColor =
                  option.textColor ?? (option.tone === 'danger' ? 'text-redOne' : 'text-black')
                const iconSize = option.iconSize ?? 'text-sm'

                return (
                  <div key={option.id}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-4 px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[var(--hover-color)] ${textColor}`}
                      onClick={() => {
                        setOpen(false)
                        option.onSelect?.()
                      }}
                    >
                      {option.icon ? (
                        <span className={`${option.icon} ${textColor} ${iconSize}`} />
                      ) : null}
                      <span className={`${textColor} text-xs font-light`}>{option.label}</span>
                    </button>
                    {index < options.length - 1 ? (
                      <div className="w-full border border-greyFour" />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
