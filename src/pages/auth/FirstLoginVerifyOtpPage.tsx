import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'

import {
  useRequestFirstLoginOtpMutation,
  useVerifyFirstLoginOtpMutation,
} from '@/app/services/recoveryApi'
import { AppLogo } from '@/components/brand/app-logo'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/i18n/useI18n'
import {
  readFirstLoginFlowState,
  saveFirstLoginFlowState,
  type FirstLoginFlowState,
} from '@/pages/auth/first-login-flow'

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
  const temporaryPassword = (locationState as { temporaryPassword?: unknown }).temporaryPassword
  const setupToken = (locationState as { setupToken?: unknown }).setupToken

  if (typeof email !== 'string' || email.trim().length === 0) return null
  if (typeof temporaryPassword !== 'string' || temporaryPassword.length === 0) return null

  return {
    email: email.trim(),
    temporaryPassword,
    setupToken:
      typeof setupToken === 'string' && setupToken.trim().length > 0 ? setupToken : undefined,
  }
}

export function FirstLoginVerifyOtpPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
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

  if (!flowState) {
    return <Navigate to="/login" replace />
  }

  const normalizedOtp = otp.replace(/\D/g, '').slice(0, 6)
  const otpError =
    normalizedOtp.length > 0 && normalizedOtp.length < 6
      ? t('auth.firstLogin.otp.invalid')
      : undefined
  const canSubmit = normalizedOtp.length === 6

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResendMessage(null)

    if (!canSubmit) {
      setError(t('auth.firstLogin.otp.fixFields'))
      return
    }

    try {
      const result = await verifyOtp({ email: flowState.email, otp: normalizedOtp }).unwrap()
      const setupToken = result.content?.setupToken
      if (!setupToken) {
        setError(t('auth.firstLogin.otp.verifyFailed'))
        return
      }

      const nextState: FirstLoginFlowState = {
        email: flowState.email,
        temporaryPassword: flowState.temporaryPassword,
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
    setResendMessage(null)
    try {
      await requestOtp({ email: flowState.email }).unwrap()
      setResendMessage(t('auth.firstLogin.otp.resent', { email: flowState.email }))
    } catch (err) {
      setError(readApiMessage(err, t('auth.firstLogin.otp.resendFailed')))
    }
  }

  return (
    <Card
      padding="none"
      className="box-border w-full max-w-[584px] rounded-[10px] border-0 bg-white p-5 shadow-[0_8px_24px_2px_rgba(0,0,0,0.059)]"
    >
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col items-center gap-3 text-center">
          <AppLogo size="lg" />
          <h1 className="text-4xl font-bold leading-tight text-rp-heading">
            {t('auth.firstLogin.otp.title')}
          </h1>
          <p className="max-w-[430px] text-base text-rp-description">
            {t('auth.firstLogin.otp.description', { email: flowState.email })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            fieldType="text"
            id="first-login-email"
            name="first-login-email"
            label={t('auth.firstLogin.otp.emailLabel')}
            autoComplete="email"
            leftIcon={<Mail strokeWidth={2} />}
            value={flowState.email}
            readOnly
          />

          <InputField
            fieldType="text"
            id="first-login-otp"
            name="first-login-otp"
            label={t('auth.firstLogin.otp.codeLabel')}
            autoComplete="one-time-code"
            leftIcon={<KeyRound strokeWidth={2} />}
            placeholder={t('auth.firstLogin.otp.codePlaceholder')}
            value={normalizedOtp}
            onChange={(e) => {
              setOtp(e.target.value)
              setError(null)
              setResendMessage(null)
            }}
            error={otpError}
            aria-invalid={Boolean(otpError)}
          />

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {resendMessage ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {resendMessage}
            </p>
          ) : null}

          <LoginButton type="submit" disabled={!canSubmit || isVerifying}>
            {isVerifying ? t('auth.firstLogin.otp.verifying') : t('auth.firstLogin.otp.submit')}
          </LoginButton>

          <button
            type="button"
            className="text-sm font-semibold text-rp-icon hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              void handleResendOtp()
            }}
            disabled={isRequesting}
          >
            {isRequesting ? t('auth.firstLogin.otp.resending') : t('auth.firstLogin.otp.resend')}
          </button>
        </form>

        <p className="text-sm text-rp-description">
          {t('auth.firstLogin.otp.backToLogin')}{' '}
          <Link to="/login" className="font-semibold text-rp-heading hover:underline">
            {t('auth.firstLogin.otp.loginLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
