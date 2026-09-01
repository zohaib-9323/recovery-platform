import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  useRequestFirstLoginOtpMutation,
  useVerifyFirstLoginOtpMutation,
  useVerifySignupOtpMutation,
} from '@/app/services/recoveryApi'
import { LoginButton } from '@/components/buttons'
import { useI18n } from '@/i18n/useI18n'
import { showCustomToast } from '@/lib/showCustomToast'
import { AUTH_HEADING_CLASS } from '@/pages/auth/authFieldStyles'
import { AuthBackToLogin } from '@/pages/auth/components/AuthBackToLogin'
import {
  isFirstLoginMockEnabled,
  mockRequestFirstLoginOtp,
  mockVerifyFirstLoginOtp,
} from '@/pages/auth/first-login-mock'

const OTP_LENGTH = 6
const RESEND_TIMER_SECONDS = 300

function readApiMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message.length > 0) return message
    }
  }
  return fallback
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${remaining < 10 ? '0' : ''}${remaining}`
}

export type OtpVerifiedResult = { fromSignup: true } | { fromSignup: false; setupToken: string }

export type OtpVerificationFormProps = {
  email: string
  fromSignup: boolean
  onVerified: (result: OtpVerifiedResult) => void
  /**
   * Overrides the default "Restart signup" link (`/signup`). Pass this when
   * the form is already embedded on the signup screen, so restarting resets
   * the in-page step instead of navigating to a route that's already current.
   */
  onRestartSignup?: () => void
}

/**
 * The OTP digit-entry UI and verify/resend logic, shared by the signup
 * flow's in-page "Email Verification" step and the standalone first-login
 * `/first-login/verify-otp` route.
 */
export function OtpVerificationForm({
  email,
  fromSignup,
  onVerified,
  onRestartSignup,
}: OtpVerificationFormProps) {
  const { t } = useI18n()
  const [digits, setDigits] = useState<string[]>(() => Array<string>(OTP_LENGTH).fill(''))
  const [timer, setTimer] = useState(RESEND_TIMER_SECONDS)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const [verifyOtp, { isLoading: isVerifyingFirstLogin }] = useVerifyFirstLoginOtpMutation()
  const [requestOtp, { isLoading: isRequesting }] = useRequestFirstLoginOtpMutation()
  const [verifySignupOtp, { isLoading: isVerifyingSignup }] = useVerifySignupOtpMutation()
  const isVerifying = isVerifyingFirstLogin || isVerifyingSignup

  useEffect(() => {
    if (timer <= 0) return undefined
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  const otp = digits.join('')
  const canSubmit = digits.every((digit) => digit !== '')

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    setError(null)
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value !== '' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && digits[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted.length !== OTP_LENGTH) return
    setDigits(pasted.split(''))
    setError(null)
    inputRefs.current[OTP_LENGTH - 1]?.focus()
  }

  const handleSubmit = async () => {
    setError(null)
    if (!canSubmit) {
      setError(t('auth.firstLogin.otp.fixFields'))
      return
    }

    // Signup's email-verification step ends here — there is no temporary
    // password to replace (the user already set their real password during
    // signup), so it skips `/first-login/setup-password` entirely and shows
    // its own success popup instead.
    if (fromSignup) {
      try {
        await verifySignupOtp({ email, otp }).unwrap()
        onVerified({ fromSignup: true })
      } catch (err) {
        setError(readApiMessage(err, t('auth.firstLogin.otp.verifyFailed')))
      }
      return
    }

    try {
      // TEMPORARY (REACT_APP_FIRST_LOGIN_MOCK) — see `first-login-mock.ts`.
      const setupToken = isFirstLoginMockEnabled()
        ? (await mockVerifyFirstLoginOtp(otp)).setupToken
        : (await verifyOtp({ email, otp }).unwrap()).content?.setupToken

      if (!setupToken) {
        setError(t('auth.firstLogin.otp.verifyFailed'))
        return
      }

      onVerified({ fromSignup: false, setupToken })
    } catch (err) {
      setError(readApiMessage(err, t('auth.firstLogin.otp.verifyFailed')))
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    try {
      // TEMPORARY (REACT_APP_FIRST_LOGIN_MOCK) — see `first-login-mock.ts`.
      if (isFirstLoginMockEnabled()) {
        await mockRequestFirstLoginOtp()
      } else {
        await requestOtp({ email }).unwrap()
      }
      setTimer(RESEND_TIMER_SECONDS)
      setDigits(Array<string>(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      showCustomToast({
        type: 'success',
        title: t('common.success'),
        message: t('auth.firstLogin.otp.resent', { email }),
      })
    } catch (err) {
      setError(readApiMessage(err, t('auth.firstLogin.otp.resendFailed')))
    }
  }

  return (
    <>
      <h2 className={AUTH_HEADING_CLASS}>{t('auth.firstLogin.otp.title')}</h2>
      <p className="mt-1 text-xs font-normal text-lightBlackOne sm:mt-2 sm:text-sm lg:text-base">
        {t('auth.firstLogin.otp.description', { email })}{' '}
        {t('auth.firstLogin.otp.descriptionSuffix')}
      </p>

      <div className="mt-6 grid w-full grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        {digits.map((digit, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            aria-label={`${t('auth.firstLogin.otp.codeLabel')} ${index + 1}`}
            className="h-14 w-full rounded-[10px] bg-grey text-center text-2xl font-normal text-primary focus:outline-none sm:h-20 sm:text-3xl md:h-28 md:text-4xl lg:text-5xl"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
          />
        ))}
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-start gap-2 sm:mt-6">
        <span className="text-xsmall font-normal text-lightBlackOne md:text-normal">
          {t('auth.firstLogin.otp.didNotReceive')}
        </span>
        {fromSignup ? (
          // Signup has no resend-OTP endpoint — re-issuing the code requires
          // re-submitting the full signup form (password included), which isn't
          // safely retained across navigation. Point back to signup instead.
          onRestartSignup ? (
            <button
              type="button"
              onClick={onRestartSignup}
              className="text-sm font-bold text-primary underline underline-offset-1 sm:text-xsmall lg:text-normal"
            >
              {t('auth.signup.otp.restartSignup')}
            </button>
          ) : (
            <Link
              to="/signup"
              className="text-sm font-bold text-primary underline underline-offset-1 sm:text-xsmall lg:text-normal"
            >
              {t('auth.signup.otp.restartSignup')}
            </Link>
          )
        ) : timer > 0 ? (
          <span className="text-sm font-bold text-primary sm:text-xsmall lg:text-normal">
            {formatTimer(timer)}
          </span>
        ) : (
          <button
            type="button"
            className="flex items-center justify-center text-xsmall font-bold text-primary md:text-normal"
            onClick={() => {
              void handleResendOtp()
            }}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <span className="text-sm font-bold text-primary underline underline-offset-1 sm:text-xsmall lg:text-normal">
                {t('auth.firstLogin.otp.resend')}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="flex justify-between sm:mt-2">
        <LoginButton
          type="button"
          onClick={() => {
            void handleSubmit()
          }}
          disabled={!canSubmit || isVerifying}
        >
          {isVerifying ? t('auth.firstLogin.otp.verifying') : t('auth.firstLogin.otp.submit')}
        </LoginButton>
      </div>

      <AuthBackToLogin
        prompt={t('auth.firstLogin.otp.backToLogin')}
        linkLabel={t('auth.firstLogin.otp.loginLink')}
      />
    </>
  )
}
