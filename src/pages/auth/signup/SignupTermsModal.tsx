import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { CheckboxField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { SignupTermsContent } from '@/pages/auth/signup/SignupTermsContent'

type SignupTermsModalProps = {
  open: boolean
  onAccept: () => void
  onClose: () => void
}

/**
 * Full-screen "Terms of Use" reader — same content as trade-harmonizer's
 * `TermsModal` (`src/app/_components/terms-modal/index.tsx`), since Recovery
 * Platform is powered by/operated under Trade Harmonizer (see the
 * `AuthLayout` "Powered by Trade Harmonizer" footer). Only the styling
 * tokens are adapted to this repo's `cn()`/Tailwind config; the scroll-to-
 * accept UX and the legal text itself (`SignupTermsContent`) are unchanged.
 */
export function SignupTermsModal({ open, onAccept, onClose }: SignupTermsModalProps) {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  // The modal is `fixed inset-0`, which does NOT stop the page behind it
  // from scrolling (e.g. trackpad momentum while the cursor sits over the
  // overlay). Without this lock, the background scrolls out from under the
  // modal, and closing it leaves that stray scroll position behind — the
  // form appears to jump, framed by blank space above/below.
  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setHasScrolledToBottom(true)
    }
  }

  const handleClose = () => {
    setHasScrolledToBottom(false)
    onClose()
  }

  const handleAccept = () => {
    setHasScrolledToBottom(false)
    onAccept()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between rounded-t-[20px] border-b border-t border-inputBorder bg-grey px-6 py-4">
          <h2 className="text-base font-bold text-black sm:text-lg">
            {t('auth.signup.terms.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('common.close')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-greyOne transition-colors hover:bg-grey hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 text-xs leading-relaxed text-lightBlackOne sm:text-sm"
        >
          <SignupTermsContent />
        </div>

        <div className="shrink-0 rounded-b-[20px] border-t border-inputBorder bg-grey px-6 py-4">
          {!hasScrolledToBottom ? (
            <p className="mb-3 text-xs text-greyOne">{t('auth.signup.terms.scrollHint')}</p>
          ) : null}
          <CheckboxField
            id="signup-terms-accept"
            checked={false}
            disabled={!hasScrolledToBottom}
            onChange={() => {
              if (!hasScrolledToBottom) return
              handleAccept()
            }}
            label={t('auth.signup.terms.checkboxLabel')}
            labelClassName="text-xs sm:text-sm text-lightBlackOne"
          />
        </div>
      </div>
    </div>
  )
}
