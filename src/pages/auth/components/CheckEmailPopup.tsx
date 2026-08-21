import { Link } from 'react-router-dom'
import { Mail, X } from 'lucide-react'

import { LoginButton } from '@/components/buttons'
import { useI18n } from '@/i18n/useI18n'

type CheckEmailPopupProps = {
  email: string
  isResending: boolean
  onResend: () => void
  onClose: () => void
}

/**
 * "Check Your Email!" popup shown after a forgot-password request —
 * mirrors trade-harmonizer's `CheckYourEmailPopup` (big mail icon, bold
 * email, resend action, back-to-login footer) rather than the generic
 * checkmark `SuccessPopup` used elsewhere.
 */
export function CheckEmailPopup({ email, isResending, onResend, onClose }: CheckEmailPopupProps) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex w-full items-center justify-center p-3">
        <div className="w-full rounded-3xl bg-white p-3 sm:max-w-xl sm:p-5">
          <div className="flex w-full justify-end">
            <button
              type="button"
              disabled={isResending}
              onClick={onClose}
              aria-label={t('common.close')}
              className="text-lg text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col items-center space-y-2 text-center md:space-y-5">
            <Mail className="h-20 w-20 text-primary" strokeWidth={1.5} />
            <div className="flex flex-col gap-2">
              <h1 className="text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
                {t('auth.forgot.popupTitle')}
              </h1>
              <p className="mx-3 text-xs font-normal text-black sm:text-sm lg:text-base">
                {t('auth.forgot.popupSentTo')}
                <br />
                <strong className="text-xs font-medium text-black sm:text-sm lg:text-base">
                  {email}
                </strong>
              </p>
            </div>
            <div className="mt-3 w-full">
              <p className="text-xxtiny font-normal text-black sm:text-xs lg:text-sm">
                {t('auth.forgot.popupNoReceive')}
              </p>
              <div className="mt-3">
                <LoginButton type="button" onClick={onResend} disabled={isResending}>
                  {isResending ? t('auth.forgot.sending') : t('auth.forgot.popupAction')}
                </LoginButton>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-row items-center gap-1">
            <span className="text-xxtiny font-normal text-greyThree sm:text-xs lg:text-sm">
              {t('auth.forgot.backToLogin')}
            </span>
            <Link to="/login" className="flex flex-row items-center gap-1">
              <p className="text-xxtiny font-normal text-black sm:text-xs lg:text-sm">
                {t('auth.forgot.loginLink')}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
