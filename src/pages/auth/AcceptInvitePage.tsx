import { type FormEvent, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, User } from 'lucide-react'

import {
  useAcceptInviteMutation,
  useGetInviteDetailsQuery,
} from '@/app/services/recoveryCompanyUsersApi'
import { LoginButton } from '@/components/buttons'
import { CheckboxField, InputField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
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
import { SignupTermsModal } from '@/pages/auth/signup/SignupTermsModal'

export function AcceptInvitePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const {
    data,
    isLoading: isLoadingInvite,
    error: inviteError,
  } = useGetInviteDetailsQuery(token, {
    skip: !token,
  })
  const [acceptInvite, { isLoading: isSubmitting }] = useAcceptInviteMutation()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const checks = useMemo(
    () => ({
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      digit: /\d/.test(password),
    }),
    [password],
  )
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isValidPassword(password) &&
    passwordsMatch &&
    termsAccepted

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center px-5 text-center">
        <p className="text-sm text-red-800">{t('auth.acceptInvite.missingToken')}</p>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError(t('auth.acceptInvite.fixFields'))
      return
    }

    try {
      await acceptInvite({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        termsAccepted,
      }).unwrap()
      setShowSuccess(true)
    } catch (err) {
      setError(getRtkErrorMessage(err))
    }
  }

  return (
    <>
      <div className="h-full w-full px-5 sm:px-7 md:px-10">
        <div className="flex h-full w-full flex-col justify-center gap-2">
          <h1 className={AUTH_HEADING_CLASS}>{t('auth.acceptInvite.title')}</h1>

          {isLoadingInvite ? (
            <p className="text-sm text-lightBlackOne">{t('auth.acceptInvite.loading')}</p>
          ) : inviteError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {getRtkErrorMessage(inviteError)}
            </p>
          ) : (
            <>
              <p className="text-xs font-normal text-lightBlackOne sm:text-sm lg:text-base">
                {t('auth.acceptInvite.description', {
                  email: data?.content.email ?? '',
                  company: data?.content.companyName ?? '',
                })}
              </p>

              <form
                onSubmit={(e) => {
                  void handleSubmit(e)
                }}
                className="no-scrollbar mt-5 h-fit overflow-hidden overflow-y-scroll"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <InputField
                    fieldType="text"
                    id="accept-invite-first-name"
                    name="firstName"
                    label={t('auth.acceptInvite.firstNameLabel')}
                    labelClassName={AUTH_LABEL_CLASS}
                    className={`${AUTH_FIELD_SHELL_CLASS} flex-1`}
                    inputClassName={AUTH_INPUT_CLASS}
                    leftIcon={<User className="h-5 w-5 text-primary" strokeWidth={2} />}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <InputField
                    fieldType="text"
                    id="accept-invite-last-name"
                    name="lastName"
                    label={t('auth.acceptInvite.lastNameLabel')}
                    labelClassName={AUTH_LABEL_CLASS}
                    className={`${AUTH_FIELD_SHELL_CLASS} flex-1`}
                    inputClassName={AUTH_INPUT_CLASS}
                    leftIcon={<User className="h-5 w-5 text-primary" strokeWidth={2} />}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <div className="mt-5 flex w-full flex-col gap-2">
                  <InputField
                    fieldType="password"
                    id="accept-invite-password"
                    name="password"
                    label={t('auth.acceptInvite.passwordLabel')}
                    labelClassName={AUTH_LABEL_CLASS}
                    className={AUTH_FIELD_SHELL_CLASS}
                    inputClassName={AUTH_INPUT_CLASS}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    leftIcon={<KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    rightSlot={
                      <button
                        type="button"
                        className="rounded p-1 text-primary hover:bg-lightGrey"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={
                          showPassword ? t('common.hidePassword') : t('common.showPassword')
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                </div>

                <PasswordRules checks={checks} />

                <div className="my-5 flex w-full flex-col gap-2">
                  <InputField
                    fieldType="password"
                    id="accept-invite-confirm-password"
                    name="confirmPassword"
                    label={t('auth.acceptInvite.confirmPasswordLabel')}
                    labelClassName={AUTH_LABEL_CLASS}
                    className={AUTH_FIELD_SHELL_CLASS}
                    inputClassName={AUTH_INPUT_CLASS}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    leftIcon={<KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={
                      confirmPassword.length > 0 && !passwordsMatch
                        ? t('auth.acceptInvite.passwordsDoNotMatch')
                        : undefined
                    }
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
                </div>

                <div className="mb-5 flex flex-row items-center gap-3">
                  <CheckboxField
                    id="accept-invite-terms"
                    checked={termsAccepted}
                    onChange={() => {
                      if (termsAccepted) {
                        setTermsAccepted(false)
                      } else {
                        setIsTermsOpen(true)
                      }
                    }}
                  />
                  <p className="text-xs text-lightBlackOne sm:text-sm">
                    {t('auth.signup.termsPrefix')}{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsOpen(true)}
                      className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      {t('auth.signup.termsLink')}
                    </button>
                  </p>
                </div>

                {error ? (
                  <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {error}
                  </p>
                ) : null}

                <div className="w-full">
                  <LoginButton type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting
                      ? t('auth.acceptInvite.submitting')
                      : t('auth.acceptInvite.submit')}
                  </LoginButton>
                </div>
              </form>
            </>
          )}

          <AuthBackToLogin
            prompt={t('auth.acceptInvite.backToLogin')}
            linkLabel={t('auth.acceptInvite.loginLink')}
          />
        </div>
      </div>

      <SignupTermsModal
        open={isTermsOpen}
        onAccept={() => {
          setTermsAccepted(true)
          setIsTermsOpen(false)
        }}
        onClose={() => setIsTermsOpen(false)}
      />

      {showSuccess ? (
        <PasswordSuccessPopup
          title={t('auth.acceptInvite.successTitle')}
          description={t('auth.acceptInvite.successDescription')}
          actionLabel={t('auth.acceptInvite.successAction')}
          onAction={() => navigate('/login', { replace: true })}
        />
      ) : null}
    </>
  )
}
