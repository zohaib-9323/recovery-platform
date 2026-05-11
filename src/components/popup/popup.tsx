import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

type PopupProps = {
  open: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
}

export function Popup({
  open,
  onClose,
  children,
  className,
  showCloseButton = false,
  closeOnBackdrop = true,
}: PopupProps) {
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <button
        type="button"
        aria-label={t('popup.closeOverlay')}
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (closeOnBackdrop) onClose?.()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-[560px] rounded-2xl border border-rp-border bg-white p-6 shadow-xl',
          className,
        )}
      >
        {showCloseButton ? (
          <button
            type="button"
            aria-label={t('popup.close')}
            className="absolute right-4 top-4 rounded p-1 text-rp-icon hover:bg-rp-surface"
            onClick={() => onClose?.()}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  )
}
