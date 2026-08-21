import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Eye, EyeOff, KeyRound } from 'lucide-react'

import { useResetPasswordMutation } from '@/app/services/recoveryApi'
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

export function ResetPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  if (!token) {
    return <Navigate to="/forgot-password" replace />
  }

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

  const canSubmit = isValidPassword(newPasswordTrimmed) && matches

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!canSubmit) {
      setError(t('auth.reset.fixFields'))
      return
    }

    try {
      await resetPassword({ token, newPassword: newPasswordTrimmed }).unwrap()
      setShowSuccess(true)
    } catch (err) {
      setError(readApiMessage(err, t('auth.reset.failed')))
    }
  }

  return (
    <>
      <div className="h-full w-full px-5 sm:px-7 md:px-10">
        <div className="flex h-full w-full flex-col justify-center gap-2">
          <h1 className={AUTH_HEADING_CLASS}>{t('auth.reset.title')}</h1>
          <p className="text-xs font-normal text-lightBlackOne sm:text-sm lg:text-base">
            {t('auth.reset.description')}
          </p>

          <form
            onSubmit={handleSubmit}
            className="no-scrollbar h-fit overflow-hidden overflow-y-scroll"
          >
            <div className="mt-5 flex w-full flex-col gap-2">
              <InputField
                fieldType="password"
                id="new-password"
                name="new-password"
                label={t('auth.reset.newPasswordLabel')}
                labelClassName={AUTH_LABEL_CLASS}
                className={AUTH_FIELD_SHELL_CLASS}
                inputClassName={AUTH_INPUT_CLASS}
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value.trim())
                  setError(null)
                }}
                aria-invalid={newPasswordTrimmed.length > 0 && !isValidPassword(newPasswordTrimmed)}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-primary hover:bg-primary/10"
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
                id="confirm-password"
                name="confirm-password"
                label={t('auth.reset.confirmPasswordLabel')}
                labelClassName={AUTH_LABEL_CLASS}
                className={AUTH_FIELD_SHELL_CLASS}
                inputClassName={AUTH_INPUT_CLASS}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value.trim())
                  setError(null)
                }}
                aria-invalid={confirmPasswordTrimmed.length > 0 && !matches}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-primary hover:bg-primary/10"
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
              {canSubmit ? (
                <div className="flex flex-row items-center gap-2">
                  <Check className="h-3 w-3 text-greenOne" strokeWidth={3} />
                  <p className="text-tiny font-normal text-greenOne">{t('auth.reset.matched')}</p>
                </div>
              ) : null}
              {confirmPasswordTrimmed && !canSubmit ? (
                <p className="text-tiny font-normal text-lightBlackOne">
                  {t('auth.reset.notMatchedYet')}
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
                {isLoading ? t('auth.reset.submitting') : t('auth.reset.submit')}
              </LoginButton>
            </div>
          </form>

          <AuthBackToLogin
            prompt={t('auth.reset.backToLogin')}
            linkLabel={t('auth.reset.loginLink')}
          />
        </div>
      </div>

      {showSuccess ? (
        <PasswordSuccessPopup
          title={t('auth.reset.popupTitle')}
          description={t('auth.reset.popupDescription')}
          actionLabel={t('auth.reset.popupAction')}
          onAction={() => navigate('/login', { replace: true })}
        />
      ) : null}
    </>
  )
}
