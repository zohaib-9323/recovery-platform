import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff, KeyRound } from 'lucide-react'

import { logout } from '@/app/features/auth/authSlice'
import { useAppDispatch } from '@/app/redux-hooks'
import { useSetupFirstLoginPasswordMutation } from '@/app/services/recoveryApi'
import { AppLogo } from '@/components/brand/app-logo'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { SuccessPopup } from '@/components/popup'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/i18n/useI18n'
import { isValidPassword } from '@/lib/validation'
import {
  clearFirstLoginFlowState,
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
  if (typeof setupToken !== 'string' || setupToken.trim().length === 0) return null

  return {
    email: email.trim(),
    temporaryPassword,
    setupToken: setupToken.trim(),
  }
}

function RuleItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span
      className={`flex items-center gap-1 text-xs ${ok ? 'text-[#22A45D]' : 'text-rp-description'}`}
    >
      <Check className="h-3.5 w-3.5" />
      {text}
    </span>
  )
}

export function FirstLoginSetupPasswordPage() {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [setupPassword, { isLoading }] = useSetupFirstLoginPasswordMutation()

  const flowState = useMemo(() => {
    const fromLocation = getStateFromLocation(location.state)
    if (fromLocation) return fromLocation
    const saved = readFirstLoginFlowState()
    if (!saved?.setupToken) return null
    return saved
  }, [location.state])

  useEffect(() => {
    if (flowState) saveFirstLoginFlowState(flowState)
  }, [flowState])

  if (!flowState?.setupToken) {
    return <Navigate to="/first-login/verify-otp" replace />
  }
  const setupToken = flowState.setupToken

  const newPasswordTrimmed = newPassword.trim()
  const confirmPasswordTrimmed = confirmPassword.trim()
  const matches = newPasswordTrimmed.length > 0 && newPasswordTrimmed === confirmPasswordTrimmed
  const checks = {
    length: newPasswordTrimmed.length >= 8,
    lower: /[a-z]/.test(newPasswordTrimmed),
    upper: /[A-Z]/.test(newPasswordTrimmed),
    special: /[^A-Za-z0-9]/.test(newPasswordTrimmed),
    digit: /\d/.test(newPasswordTrimmed),
  }

  const newPasswordError =
    newPasswordTrimmed.length > 0 && !isValidPassword(newPasswordTrimmed)
      ? t('auth.firstLogin.setup.rulesError')
      : undefined
  const confirmPasswordError =
    confirmPasswordTrimmed.length > 0 && !matches
      ? t('auth.firstLogin.setup.passwordMismatch')
      : undefined
  const canSubmit = isValidPassword(newPasswordTrimmed) && matches

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError(t('auth.firstLogin.setup.fixFields'))
      return
    }

    try {
      await setupPassword({
        setupToken,
        temporaryPassword: flowState.temporaryPassword,
        newPassword: newPasswordTrimmed,
        confirmPassword: confirmPasswordTrimmed,
      }).unwrap()

      clearFirstLoginFlowState()
      dispatch(logout())
      setShowSuccess(true)
    } catch (err) {
      setError(readApiMessage(err, t('auth.firstLogin.setup.failed')))
    }
  }

  return (
    <>
      <Card
        padding="none"
        className="box-border w-full max-w-[584px] rounded-[10px] border-0 bg-white p-5 shadow-[0_8px_24px_2px_rgba(0,0,0,0.059)]"
      >
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-col items-center gap-3 text-center">
            <AppLogo size="lg" />
            <h1 className="text-4xl font-bold leading-tight text-rp-heading">
              {t('auth.firstLogin.setup.title')}
            </h1>
            <p className="max-w-[430px] text-base text-rp-description">
              {t('auth.firstLogin.setup.description')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <InputField
                fieldType="password"
                id="first-login-new-password"
                name="first-login-new-password"
                label={t('auth.firstLogin.setup.newPasswordLabel')}
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<KeyRound strokeWidth={2} />}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value.trim())
                  setError(null)
                }}
                error={newPasswordError}
                aria-invalid={Boolean(newPasswordError)}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-rp-icon hover:bg-rp-accent/10"
                    onClick={() => setShowNewPassword((s) => !s)}
                    aria-label={
                      showNewPassword ? t('common.hidePassword') : t('common.showPassword')
                    }
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-5">
                <RuleItem ok={checks.length} text={t('auth.firstLogin.setup.rule.length')} />
                <RuleItem ok={checks.lower} text={t('auth.firstLogin.setup.rule.lower')} />
                <RuleItem ok={checks.upper} text={t('auth.firstLogin.setup.rule.upper')} />
                <RuleItem ok={checks.special} text={t('auth.firstLogin.setup.rule.special')} />
                <RuleItem ok={checks.digit} text={t('auth.firstLogin.setup.rule.digit')} />
              </div>
            </div>

            <div className="space-y-2">
              <InputField
                fieldType="password"
                id="first-login-confirm-password"
                name="first-login-confirm-password"
                label={t('auth.firstLogin.setup.confirmPasswordLabel')}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<KeyRound strokeWidth={2} />}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value.trim())
                  setError(null)
                }}
                error={confirmPasswordError}
                aria-invalid={Boolean(confirmPasswordError)}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-rp-icon hover:bg-rp-accent/10"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={
                      showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
              />
              {confirmPasswordTrimmed ? (
                <p className={`text-xs ${matches ? 'text-[#22A45D]' : 'text-rp-description'}`}>
                  {matches
                    ? t('auth.firstLogin.setup.matched')
                    : t('auth.firstLogin.setup.notMatchedYet')}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <LoginButton type="submit" disabled={!canSubmit || isLoading}>
              {isLoading
                ? t('auth.firstLogin.setup.submitting')
                : t('auth.firstLogin.setup.submit')}
            </LoginButton>
          </form>

          <p className="text-sm text-rp-description">
            {t('auth.firstLogin.setup.backToLogin')}{' '}
            <Link to="/login" className="font-semibold text-rp-heading hover:underline">
              {t('auth.firstLogin.setup.loginLink')}
            </Link>
          </p>
        </CardContent>
      </Card>

      <SuccessPopup
        open={showSuccess}
        title={t('auth.firstLogin.setup.popupTitle')}
        description={t('auth.firstLogin.setup.popupDescription')}
        actionLabel={t('auth.firstLogin.setup.popupAction')}
        onAction={() => navigate('/login', { replace: true })}
        onClose={() => setShowSuccess(false)}
      />
    </>
  )
}
