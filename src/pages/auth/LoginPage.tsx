import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'

import { useLoginMutation } from '@/app/services/recoveryApi'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { useAuth } from '@/app/hooks/useAuth'
import { useI18n } from '@/i18n/useI18n'
import { showCustomToast } from '@/lib/showCustomToast'
import { isValidEmail } from '@/lib/validation'
import {
  AUTH_DESCRIPTION_CLASS,
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

/**
 * What a 403 from `POST /recovery/auth/login` is actually asking for.
 *
 * The backend rejects a *correct* password with 403 in two different
 * situations, and they need different screens:
 *
 * - `password-setup` — an owner-created account whose one-time password still
 *   has to be replaced. OTP, then set a new password.
 * - `email-verification` — an account that already has a password the user
 *   chose, but never verified their email. This is the abandoned-signup and
 *   abandoned-invite case: they filled in the form, closed the tab before
 *   entering the code, and came back to log in. They need to verify only —
 *   sending them through password setup would make them replace a password
 *   they deliberately chose.
 *
 * Read from the structured flags rather than the message text: a reworded
 * message must not silently turn a valid login into "invalid credentials",
 * which is what a `/first login/i` match on the prose used to do to the
 * email-verification case.
 */
function readLoginBlock(err: unknown): 'password-setup' | 'email-verification' | null {
  if (!err || typeof err !== 'object') return null

  // Look at the RTK Query envelope's `data` and at the error object itself:
  // depending on where the failure is raised the body arrives as
  // `{ status, data: body }` or as the body directly, and a wrong guess here
  // silently downgrades a valid login to "invalid credentials".
  const candidates = [(err as { data?: unknown }).data, err].filter(
    (candidate): candidate is Record<string, unknown> =>
      Boolean(candidate) && typeof candidate === 'object',
  )

  for (const body of candidates) {
    const code = body.statusCode ?? body.status
    if (code !== 403) continue

    // The API's exception filter rebuilds every error body as
    // {statusCode, message, status, content}, so the flags arrive nested in
    // `content` rather than at the top level. Check both.
    const flagSources = [body.content, body].filter(
      (source): source is Record<string, unknown> => Boolean(source) && typeof source === 'object',
    )
    for (const source of flagSources) {
      if (source.passwordResetRequired === true) return 'password-setup'
      if (source.otpRequired === true) return 'email-verification'
    }

    // Last resort: the message text. Older builds — and any throw that forgets
    // to nest its flags — lose the flags entirely at the filter, and stranding
    // a correct password behind "invalid credentials" is the worse failure.
    const { message } = body
    if (typeof message === 'string') {
      if (/password setup/i.test(message)) return 'password-setup'
      if (/verification required/i.test(message)) return 'email-verification'
    }
  }

  return null
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
      const block = readLoginBlock(err)
      if (block) {
        // The backend has already emailed a fresh code by the time it throws,
        // so both branches land straight on the OTP screen.
        saveFirstLoginFlowState({
          email: trimmedEmail,
          // Verify-only: skip the set-password step they don't need.
          ...(block === 'email-verification' ? { fromSignup: true } : {}),
        })
        navigate('/first-login/verify-otp', {
          replace: true,
          state: { fromSignup: block === 'email-verification' },
        })
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
            <p className={AUTH_DESCRIPTION_CLASS}>{t('auth.login.subtitle')}</p>

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
                    className="rounded p-1 text-primary hover:bg-lightGrey"
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

        <div className="flex w-full flex-row items-center justify-start gap-1">
          <span className="text-xs font-normal text-greyThree sm:text-sm">
            {t('auth.login.noAccount')}
          </span>
          <Link
            to="/signup"
            className="flex flex-row items-center text-xs font-normal text-black sm:text-sm"
          >
            {t('auth.login.signupLink')}
            <ArrowUpRight className="h-5 w-5 text-black" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  )
}
