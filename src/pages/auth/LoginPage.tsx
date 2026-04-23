import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react'

import { useLoginMutation } from '@/app/services/recoveryApi'
import { AppLogo } from '@/components/brand/app-logo'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/app/hooks/useAuth'
import { useI18n } from '@/i18n/useI18n'
import { showCustomToast } from '@/lib/showCustomToast'
import { isValidEmail } from '@/lib/validation'

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
    (typeof document !== 'undefined' ? document.documentElement.dataset.tenantName : undefined) ??
    t('auth.login.title')

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
      showCustomToast({
        type: 'error',
        title: t('auth.login.invalidCredentials'),
        message: getErrorMessage(err, t('auth.login.invalidCredentials')),
      })
    }
  }

  return (
    <Card
      padding="none"
      className="box-border min-h-[450.720703125px] w-full max-w-[584px] rounded-[10px] border-0 bg-white p-5 shadow-[0_8px_24px_2px_rgba(0,0,0,0.059)]"
    >
      <CardContent className="flex flex-col gap-[10px] p-0">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <AppLogo size="lg" />
          <h1 className="text-2xl font-bold text-rp-heading">{tenantName}</h1>
          <p className="text-sm text-rp-description">{t('auth.login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
          <InputField
            fieldType="email"
            id="email"
            name="email"
            label={t('auth.login.emailLabel')}
            autoComplete="email"
            leftIcon={<Mail strokeWidth={2} />}
            placeholder={t('auth.login.emailPlaceholder')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value.replace(/\s/g, ''))
            }}
            error={emailError}
            aria-invalid={Boolean(emailError)}
          />

          <div className="flex flex-col gap-2">
            <InputField
              fieldType="password"
              id="password"
              name="password"
              label={t('auth.login.passwordLabel')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              leftIcon={<KeyRound strokeWidth={2} />}
              placeholder={t('auth.login.passwordPlaceholder')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              rightSlot={
                <button
                  type="button"
                  className="rounded p-1 text-rp-icon hover:bg-rp-accent/10"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-semibold text-rp-icon hover:underline"
                onClick={() => navigate('/forgot-password')}
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>
          </div>

          <LoginButton type="submit" disabled={!canSubmit || isLoading}>
            {isLoading ? t('auth.login.signingIn') : t('auth.login.submit')}
          </LoginButton>
        </form>
      </CardContent>
    </Card>
  )
}
