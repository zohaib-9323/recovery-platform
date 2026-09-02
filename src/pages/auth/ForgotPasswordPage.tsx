import { type FormEvent, useState } from 'react'
import { Mail } from 'lucide-react'

import { useRequestPasswordResetMutation } from '@/app/services/recoveryApi'
import { InputField } from '@/components/fields'
import { LoginButton } from '@/components/buttons'
import { useI18n } from '@/i18n/useI18n'
import { isValidEmail } from '@/lib/validation'
import {
  AUTH_FIELD_SHELL_CLASS,
  AUTH_HEADING_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from '@/pages/auth/authFieldStyles'
import { AuthBackToLogin } from '@/pages/auth/components/AuthBackToLogin'
import { CheckEmailPopup } from '@/pages/auth/components/CheckEmailPopup'

function readApiMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message) return message
    }
  }
  return fallback
}

export function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [showCheckEmail, setShowCheckEmail] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation()

  const trimmedEmail = email.trim()
  const emailError =
    trimmedEmail.length > 0 && !isValidEmail(trimmedEmail)
      ? t('auth.forgot.enterValidEmail')
      : undefined
  const canSubmit = isValidEmail(trimmedEmail)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(trimmedEmail)) {
      setError(t('auth.forgot.pleaseEnterValidEmail'))
      return
    }

    try {
      await requestReset({ email: trimmedEmail }).unwrap()
      setSubmittedEmail(trimmedEmail)
      setShowCheckEmail(true)
    } catch (err) {
      setError(readApiMessage(err, t('auth.forgot.failedToSend')))
    }
  }

  const handleResend = async () => {
    try {
      await requestReset({ email: submittedEmail || trimmedEmail }).unwrap()
    } catch {
      // The popup stays open — the user can retry the resend action.
    }
  }

  return (
    <>
      <div className="flex min-h-fit w-full px-5 sm:px-7 md:px-10">
        <div className="flex w-full flex-col items-start justify-center gap-2">
          <h1 className={AUTH_HEADING_CLASS}>{t('auth.forgot.title')}</h1>
          <p className="text-xs font-normal text-lightBlackOne sm:text-sm lg:text-base">
            {t('auth.forgot.description')}
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="mt-4 flex w-full flex-col gap-2">
              <InputField
                fieldType="email"
                id="forgot-email"
                name="forgot-email"
                label={t('auth.forgot.emailLabel')}
                labelClassName={AUTH_LABEL_CLASS}
                className={AUTH_FIELD_SHELL_CLASS}
                inputClassName={AUTH_INPUT_CLASS}
                autoComplete="email"
                leftIcon={<Mail className="h-5 w-5 text-primary" strokeWidth={2} />}
                placeholder={t('auth.forgot.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.replace(/\s/g, ''))
                  setError(null)
                }}
                error={emailError}
                aria-invalid={Boolean(emailError)}
              />
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <div className="mt-5 w-full">
              <LoginButton type="submit" disabled={!canSubmit || isLoading}>
                {isLoading ? t('auth.forgot.sending') : t('auth.forgot.send')}
              </LoginButton>
            </div>
          </form>

          <AuthBackToLogin
            prompt={t('auth.forgot.backToLogin')}
            linkLabel={t('auth.forgot.loginLink')}
          />
        </div>
      </div>

      {showCheckEmail ? (
        <CheckEmailPopup
          email={submittedEmail}
          isResending={isLoading}
          onResend={() => {
            void handleResend()
          }}
          onClose={() => setShowCheckEmail(false)}
        />
      ) : null}
    </>
  )
}
