import {
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import {
  useRequestFirstLoginOtpMutation,
  useVerifyFirstLoginOtpMutation,
} from '@/app/services/recoveryApi'
import { LoginButton } from '@/components/buttons'
import { useI18n } from '@/i18n/useI18n'
import { showCustomToast } from '@/lib/showCustomToast'
import { AUTH_HEADING_CLASS } from '@/pages/auth/authFieldStyles'
import { AuthBackToLogin } from '@/pages/auth/components/AuthBackToLogin'
import { PasswordSuccessPopup } from '@/pages/auth/components/PasswordSuccessPopup'
import {
  clearFirstLoginFlowState,
  readFirstLoginFlowState,
  saveFirstLoginFlowState,
  type FirstLoginFlowState,
} from '@/pages/auth/first-login-flow'
import {
  isFirstLoginMockEnabled,
  mockRequestFirstLoginOtp,
  mockVerifyFirstLoginOtp,
} from '@/pages/auth/first-login-mock'
import { SignupStepper } from '@/pages/auth/signup/SignupStepper'

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

function getStateFromLocation(locationState: unknown): FirstLoginFlowState | null {
  if (!locationState || typeof locationState !== 'object') return null
  const email = (locationState as { email?: unknown }).email
  const setupToken = (locationState as { setupToken?: unknown }).setupToken
  const fromSignup = (locationState as { fromSignup?: unknown }).fromSignup

  if (typeof email !== 'string' || email.trim().length === 0) return null

  return {
    email: email.trim(),
    setupToken:
      typeof setupToken === 'string' && setupToken.trim().length > 0 ? setupToken : undefined,
    fromSignup: fromSignup === true,
  }
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${remaining < 10 ? '0' : ''}${remaining}`
}

export function FirstLoginVerifyOtpPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [digits, setDigits] = useState<string[]>(() => Array<string>(OTP_LENGTH).fill(''))
  const [timer, setTimer] = useState(RESEND_TIMER_SECONDS)
  const [error, setError] = useState<string | null>(null)
  const [showSignupVerifiedPopup, setShowSignupVerifiedPopup] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyFirstLoginOtpMutation()
  const [requestOtp, { isLoading: isRequesting }] = useRequestFirstLoginOtpMutation()

  const flowState = useMemo(() => {
    const fromLocation = getStateFromLocation(location.state)
    if (fromLocation) return fromLocation
    return readFirstLoginFlowState()
  }, [location.state])

  useEffect(() => {
    if (flowState) saveFirstLoginFlowState(flowState)
  }, [flowState])

  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  if (!flowState) {
    return <Navigate to="/login" replace />
  }

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
    // its own success popup instead. No signup-OTP backend endpoint exists
    // yet (see RECOVERY-SIGNUP-TASKS.md), so this reuses the first-login
    // mock's OTP check purely as a local UI stand-in — not tied to the
    // first-login demo account or its `REACT_APP_FIRST_LOGIN_MOCK` flag.
    if (flowState.fromSignup) {
      try {
        await mockVerifyFirstLoginOtp(otp)
        clearFirstLoginFlowState()
        setShowSignupVerifiedPopup(true)
      } catch (err) {
        setError(readApiMessage(err, t('auth.firstLogin.otp.verifyFailed')))
      }
      return
    }

    try {
      // TEMPORARY (REACT_APP_FIRST_LOGIN_MOCK) — see `first-login-mock.ts`.
      const setupToken = isFirstLoginMockEnabled()
        ? (await mockVerifyFirstLoginOtp(otp)).setupToken
        : (await verifyOtp({ email: flowState.email, otp }).unwrap()).content?.setupToken

      if (!setupToken) {
        setError(t('auth.firstLogin.otp.verifyFailed'))
        return
      }

      const nextState: FirstLoginFlowState = {
        email: flowState.email,
        setupToken,
      }
      saveFirstLoginFlowState(nextState)
      navigate('/first-login/setup-password', { replace: true, state: nextState })
    } catch (err) {
      setError(readApiMessage(err, t('auth.firstLogin.otp.verifyFailed')))
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    try {
      // TEMPORARY (REACT_APP_FIRST_LOGIN_MOCK) — see `first-login-mock.ts`.
      // Signup has no real resend-OTP endpoint yet either, so it always
      // takes the local mock path regardless of the env flag.
      if (flowState.fromSignup || isFirstLoginMockEnabled()) {
        await mockRequestFirstLoginOtp()
      } else {
        await requestOtp({ email: flowState.email }).unwrap()
      }
      setTimer(RESEND_TIMER_SECONDS)
      setDigits(Array<string>(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      showCustomToast({
        type: 'success',
        title: t('common.success'),
        message: t('auth.firstLogin.otp.resent', { email: flowState.email }),
      })
    } catch (err) {
      setError(readApiMessage(err, t('auth.firstLogin.otp.resendFailed')))
    }
  }

  return (
    <>
      <div className="h-full w-full px-5 sm:px-7 md:px-10">
        <div className="flex h-full w-full flex-col justify-center gap-2">
          <SignupStepper activeStep="email-verification" className="mb-4" />
          <h2 className={AUTH_HEADING_CLASS}>{t('auth.firstLogin.otp.title')}</h2>
          <p className="mt-1 text-xs font-normal text-lightBlackOne sm:mt-2 sm:text-sm lg:text-base">
            {t('auth.firstLogin.otp.description', { email: flowState.email })}{' '}
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
            {timer > 0 ? (
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
        </div>
      </div>

      {showSignupVerifiedPopup ? (
        <PasswordSuccessPopup
          title={t('auth.signup.otp.successTitle')}
          description={t('auth.signup.otp.successDescription')}
          actionLabel={t('auth.signup.otp.successAction')}
          onAction={() => navigate('/login', { replace: true })}
        />
      ) : null}
    </>
  )
}
