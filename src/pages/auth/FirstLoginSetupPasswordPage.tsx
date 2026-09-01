import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff, KeyRound } from 'lucide-react'

import { logout } from '@/app/features/auth/authSlice'
import { useAppDispatch } from '@/app/redux-hooks'
import { useSetupFirstLoginPasswordMutation } from '@/app/services/recoveryApi'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { isValidPassword } from '@/lib/validation'
import {
  AUTH_FIELD_SHELL_CLASS,
  AUTH_HEADING_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from '@/pages/auth/authFieldStyles'
import { AuthBackToLogin } from '@/pages/auth/components/AuthBackToLogin'
import { PasswordRules } from '@/pages/auth/components/PasswordRules'
import { PasswordSuccessPopup } from '@/pages/auth/components/PasswordSuccessPopup'
import {
  clearFirstLoginFlowState,
  readFirstLoginFlowState,
  saveFirstLoginFlowState,
  type FirstLoginFlowState,
} from '@/pages/auth/first-login-flow'
import { isFirstLoginMockEnabled, mockSetupFirstLoginPassword } from '@/pages/auth/first-login-mock'

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

  if (typeof email !== 'string' || email.trim().length === 0) return null
  if (typeof setupToken !== 'string' || setupToken.trim().length === 0) return null

  return {
    email: email.trim(),
    setupToken: setupToken.trim(),
  }
}

export function FirstLoginSetupPasswordPage() {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false)
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

  const temporaryPasswordTrimmed = temporaryPassword.trim()
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
  const passwordsReady = isValidPassword(newPasswordTrimmed) && matches
  const canSubmit = passwordsReady && temporaryPasswordTrimmed.length > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError(t('auth.firstLogin.setup.fixFields'))
      return
    }

    try {
      // TEMPORARY (REACT_APP_FIRST_LOGIN_MOCK) — see `first-login-mock.ts`.
      if (isFirstLoginMockEnabled()) {
        await mockSetupFirstLoginPassword(temporaryPasswordTrimmed)
      } else {
        await setupPassword({
          setupToken,
          temporaryPassword: temporaryPasswordTrimmed,
          newPassword: newPasswordTrimmed,
          confirmPassword: confirmPasswordTrimmed,
        }).unwrap()
      }

      clearFirstLoginFlowState()
      dispatch(logout())
      setShowSuccess(true)
    } catch (err) {
      setError(readApiMessage(err, t('auth.firstLogin.setup.failed')))
    }
  }

  return (
    <>
      <div className="h-full w-full px-5 sm:px-7 md:px-10">
        <div className="flex h-full w-full flex-col justify-center gap-2">
          <h1 className={AUTH_HEADING_CLASS}>{t('auth.firstLogin.setup.title')}</h1>
          <p className="text-xs font-normal text-lightBlackOne sm:text-sm lg:text-base">
            {t('auth.firstLogin.setup.description')}
          </p>

          <form
            onSubmit={handleSubmit}
            className="no-scrollbar h-fit overflow-hidden overflow-y-scroll"
          >
            <div className="mt-5 flex w-full flex-col gap-2">
              <InputField
                fieldType="password"
                id="first-login-temporary-password"
                name="first-login-temporary-password"
                label={t('auth.firstLogin.setup.temporaryPasswordLabel')}
                labelClassName={AUTH_LABEL_CLASS}
                className={AUTH_FIELD_SHELL_CLASS}
                inputClassName={AUTH_INPUT_CLASS}
                type={showTemporaryPassword ? 'text' : 'password'}
                autoComplete="current-password"
                leftIcon={<KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />}
                placeholder={t('auth.firstLogin.setup.temporaryPasswordPlaceholder')}
                value={temporaryPassword}
                onChange={(e) => {
                  setTemporaryPassword(e.target.value)
                  setError(null)
                }}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-primary hover:bg-lightGrey"
                    onClick={() => setShowTemporaryPassword((s) => !s)}
                    aria-label={
                      showTemporaryPassword ? t('common.hidePassword') : t('common.showPassword')
                    }
                  >
                    {showTemporaryPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
              />
            </div>

            <div className="mt-5 flex w-full flex-col gap-2">
              <InputField
                fieldType="password"
                id="first-login-new-password"
                name="first-login-new-password"
                label={t('auth.firstLogin.setup.newPasswordLabel')}
                labelClassName={AUTH_LABEL_CLASS}
                className={AUTH_FIELD_SHELL_CLASS}
                inputClassName={AUTH_INPUT_CLASS}
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />}
                placeholder={t('auth.firstLogin.setup.newPasswordPlaceholder')}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value.trim())
                  setError(null)
                }}
                aria-invalid={newPasswordTrimmed.length > 0 && !isValidPassword(newPasswordTrimmed)}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-primary hover:bg-lightGrey"
                    onClick={() => setShowNewPassword((s) => !s)}
                    aria-label={
                      showNewPassword ? t('common.hidePassword') : t('common.showPassword')
                    }
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
            </div>

            <PasswordRules checks={checks} />

            <div className="my-8 flex w-full flex-col gap-2">
              <InputField
                fieldType="password"
                id="first-login-confirm-password"
                name="first-login-confirm-password"
                label={t('auth.firstLogin.setup.confirmPasswordLabel')}
                labelClassName={AUTH_LABEL_CLASS}
                className={AUTH_FIELD_SHELL_CLASS}
                inputClassName={AUTH_INPUT_CLASS}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />}
                placeholder={t('auth.firstLogin.setup.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value.trim())
                  setError(null)
                }}
                aria-invalid={confirmPasswordTrimmed.length > 0 && !matches}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-primary hover:bg-lightGrey"
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
              {passwordsReady ? (
                <div className="flex flex-row items-center gap-2">
                  <Check className="h-3 w-3 text-greenOne" strokeWidth={3} />
                  <p className="text-tiny font-normal text-greenOne">
                    {t('auth.firstLogin.setup.matched')}
                  </p>
                </div>
              ) : null}
              {confirmPasswordTrimmed && !passwordsReady ? (
                <p className="text-tiny font-normal text-lightBlackOne">
                  {t('auth.firstLogin.setup.notMatchedYet')}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <div className="w-full">
              <LoginButton type="submit" disabled={!canSubmit || isLoading}>
                {isLoading
                  ? t('auth.firstLogin.setup.submitting')
                  : t('auth.firstLogin.setup.submit')}
              </LoginButton>
            </div>
          </form>

          <AuthBackToLogin
            prompt={t('auth.firstLogin.setup.backToLogin')}
            linkLabel={t('auth.firstLogin.setup.loginLink')}
          />
        </div>
      </div>

      {showSuccess ? (
        <PasswordSuccessPopup
          title={t('auth.firstLogin.setup.popupTitle')}
          description={t('auth.firstLogin.setup.popupDescription')}
          actionLabel={t('auth.firstLogin.setup.popupAction')}
          onAction={() => navigate('/login', { replace: true })}
        />
      ) : null}
    </>
  )
}
