import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react'

import { useLoginMutation } from '@/app/services/recoveryApi'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { useAuth } from '@/app/hooks/useAuth'
import { useI18n } from '@/i18n/useI18n'
import { showCustomToast } from '@/lib/showCustomToast'
import { isValidEmail } from '@/lib/validation'
import {
  AUTH_FIELD_SHELL_CLASS,
  AUTH_HEADING_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from '@/pages/auth/authFieldStyles'
import { saveFirstLoginFlowState } from '@/pages/auth/first-login-flow'

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const m = (data as { message?: unknown }).message
      if (typeof m === 'string' && m.length > 0) return m
    }
    if (typeof data === 'string' && data.length > 0) return data
  }
  return fallback
}

function isFirstLoginSetupError(err: unknown): boolean {
  if (!err || typeof err !== 'object' || !('data' in err)) return false
  const data = (err as { data?: unknown }).data
  if (!data || typeof data !== 'object') return false
  const statusCode = (data as { statusCode?: unknown }).statusCode
  const message = (data as { message?: unknown }).message
  return statusCode === 403 && typeof message === 'string' && /first login/i.test(message)
}

export function LoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [login, { isLoading }] = useLoginMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const trimmedEmail = email.trim()
  const emailError =
    trimmedEmail.length > 0 && !isValidEmail(trimmedEmail)
      ? t('auth.login.enterValidEmail')
      : undefined

  const canSubmit = trimmedEmail.length > 0 && password.length > 0 && isValidEmail(trimmedEmail)

  const tenantName =
    (typeof document !== 'undefined'
      ? document.documentElement.dataset.tenantName
      : undefined
    )?.trim() || t('auth.login.title')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!isValidEmail(trimmedEmail) || password.length === 0) {
      showCustomToast({
        type: 'error',
        title: t('auth.login.invalidCredentials'),
        message: t('auth.login.fixFields'),
      })
      return
    }

    try {
      await login({ email: trimmedEmail, password }).unwrap()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (isFirstLoginSetupError(err)) {
        saveFirstLoginFlowState({ email: trimmedEmail, temporaryPassword: password })
        navigate('/first-login/verify-otp', { replace: true })
        return
      }

      showCustomToast({
        type: 'error',
        title: t('auth.login.invalidCredentials'),
        message: getErrorMessage(err, t('auth.login.invalidCredentials')),
      })
    }
  }

  return (
    <div className="h-full w-full px-5 sm:px-7 md:px-10">
      <div className="flex w-full flex-col justify-start gap-2 sm:h-full md:justify-center">
        <h1 className={AUTH_HEADING_CLASS}>
          {t('auth.login.welcomeBack', { tenant: tenantName })}
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="no-scrollbar h-fit overflow-hidden overflow-y-scroll pb-4 sm:pb-8">
            <p className="text-xs font-normal text-lightBlackOne sm:text-sm lg:text-base">
              {t('auth.login.subtitle')}
            </p>

            <div className="mt-4 flex w-full flex-col gap-2">
              <InputField
                fieldType="email"
                id="email"
                name="email"
                label={t('auth.login.emailLabel')}
                labelClassName={AUTH_LABEL_CLASS}
                className={AUTH_FIELD_SHELL_CLASS}
                inputClassName={AUTH_INPUT_CLASS}
                autoComplete="email"
                leftIcon={<Mail className="h-5 w-5 text-primary" strokeWidth={2} />}
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.replace(/\s/g, ''))
                }}
                error={emailError}
                aria-invalid={Boolean(emailError)}
              />
            </div>

            <div className="mt-5 flex w-full flex-col gap-2">
              <InputField
                fieldType="password"
                id="password"
                name="password"
                label={t('auth.login.passwordLabel')}
                labelClassName={AUTH_LABEL_CLASS}
                className={AUTH_FIELD_SHELL_CLASS}
                inputClassName={AUTH_INPUT_CLASS}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                leftIcon={<KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />}
                placeholder={t('auth.login.passwordPlaceholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-primary hover:bg-primary/10"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
            </div>
            <div className="mt-2 w-full">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="float-right text-xs font-normal text-primary hover:underline"
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>
          </div>

          <div className="w-full">
            <LoginButton type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? t('auth.login.signingIn') : t('auth.login.submit')}
            </LoginButton>
          </div>
        </form>
      </div>
    </div>
  )
}
