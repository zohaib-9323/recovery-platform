import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
 * Full-screen "Terms of Use" reader — same content and scroll-to-accept UX as
 * trade-harmonizer's `TermsModal` (`src/app/_components/terms-modal/index.tsx`).
 *
 * ## Why this is a portal, and why it must stay one
 *
 * Opening this modal used to shove the signup form up by half a screen, and
 * closing it left the form there. Rendered inline, the overlay is a DOM child
 * of the element that scrolls the signup page, so mounting it moved that
 * element's scroll position. Three separate attempts to compensate from the
 * outside (locking `document.body`, locking the page's own root, reworking the
 * page shell) all failed, because they treated the symptom.
 *
 * Rendering into `document.body` removes the cause: the overlay is no longer
 * inside any scroll container, so mounting and unmounting it cannot move one.
 * `overscroll-contain` on both the backdrop and the terms panel then stops a
 * wheel gesture from chaining into the page once the panel hits its scroll end
 * — which it does every time, because accepting requires scrolling to the
 * bottom.
 *
 * `SignupPage.test.tsx` asserts the portal and the absence of a scroll
 * container on the page. Do not render this inline.
 */
export function SignupTermsModal({ open, onAccept, onClose }: SignupTermsModalProps) {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

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

  const overlay = (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-contain bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('auth.signup.terms.modalTitle')}
        className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
      >
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
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 text-xs leading-relaxed text-lightBlackOne sm:text-sm"
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

  return createPortal(overlay, document.body)
}
