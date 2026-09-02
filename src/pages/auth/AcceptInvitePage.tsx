import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import {
  useAcceptInviteMutation,
  useGetInviteDetailsQuery,
} from '@/app/services/recoveryCompanyUsersApi'
import { LoginButton } from '@/components/buttons'
import { CheckboxField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { isValidPassword } from '@/lib/validation'
import { OtpVerificationForm } from '@/pages/auth/components/OtpVerificationForm'
import { PasswordSuccessPopup } from '@/pages/auth/components/PasswordSuccessPopup'
import { CreatePasswordSection } from '@/pages/auth/signup/components/CreatePasswordSection'
import { PersonalInformationSection } from '@/pages/auth/signup/components/PersonalInformationSection'
import { SignupStepper, type SignupStep } from '@/pages/auth/signup/SignupStepper'
import { SignupTermsModal } from '@/pages/auth/signup/SignupTermsModal'
import { EMPTY_SIGNUP_FORM, type SignupFormValues } from '@/pages/auth/signup/signup-types'

/**
 * Registration for an invited company user.
 *
 * Deliberately built from the *same* pieces as `SignupPage` — the shell branch
 * in `AuthLayout`, `SignupStepper`, `PersonalInformationSection`,
 * `CreatePasswordSection`, `SignupTermsModal` — rather than a parallel set of
 * auth-styled fields. An invited user is going through signup; the only
 * differences are that the email is fixed by the token and no company details
 * are collected, because they join the inviting owner's company.
 *
 * Rebuilding it on login's centred card shell is what previously made this
 * screen look nothing like signup, and put a long form inside the shell whose
 * `items-center` overflow produced the unreachable-top-of-form bug.
 */
export function AcceptInvitePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const {
    data,
    isLoading: isLoadingInvite,
    error: inviteError,
  } = useGetInviteDetailsQuery(token, { skip: !token })
  const [acceptInvite, { isLoading: isSubmitting }] = useAcceptInviteMutation()

  /**
   * Invited users run the same two-step journey as self-signup: Personal
   * Information, then Email Verification. The invite link already proves
   * mailbox access, but the design shows the step for invited users too, and
   * sharing one OTP screen keeps the two onboarding paths from drifting apart.
   */
  const [step, setStep] = useState<SignupStep>('personal-info')
  const [values, setValues] = useState<SignupFormValues>(EMPTY_SIGNUP_FORM)
  const [touched, setTouched] = useState<Partial<Record<keyof SignupFormValues, boolean>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [showTermsError, setShowTermsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const invitedEmail = data?.content.email ?? ''

  /**
   * The invite token owns the address, so it is *derived* rather than stored:
   * the field is read-only, nothing can edit it, and submission sends the
   * token — not this value — so there is no second copy to keep in sync.
   *
   * Mirroring it into state through an effect would setState on every resolve
   * of the invite query, which cascades a render for a value React can simply
   * compute.
   */
  const formValues: SignupFormValues = invitedEmail ? { ...values, email: invitedEmail } : values

  const setField = <K extends keyof SignupFormValues>(field: K, value: SignupFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const markTouched = (field: keyof SignupFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const checks = useMemo(
    () => ({
      length: values.password.length >= 8,
      lower: /[a-z]/.test(values.password),
      upper: /[A-Z]/.test(values.password),
      special: /[^A-Za-z0-9]/.test(values.password),
      digit: /\d/.test(values.password),
    }),
    [values.password],
  )

  const passwordsMatch = values.password.length > 0 && values.password === values.confirmPassword

  const canSubmit =
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    isValidPassword(values.password) &&
    passwordsMatch &&
    values.termsAccepted

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
    setShowTermsError(!values.termsAccepted)

    if (!canSubmit) {
      setError(t('auth.acceptInvite.fixFields'))
      return
    }

    try {
      await acceptInvite({
        token,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        // Sent with its dial code, the same shape signup submits.
        ...(values.phone.trim() ? { phone: `${values.phoneCode}${values.phone.trim()}` } : {}),
        password: values.password,
        termsAccepted: values.termsAccepted,
      }).unwrap()
      setStep('email-verification')
    } catch (err) {
      setError(getRtkErrorMessage(err))
    }
  }

  return (
    <>
      <div className="w-full px-5 py-6 sm:px-7 md:px-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <SignupStepper activeStep={step} />

          {isLoadingInvite ? (
            <p className="text-sm text-lightBlackOne">{t('auth.acceptInvite.loading')}</p>
          ) : inviteError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {getRtkErrorMessage(inviteError)}
            </p>
          ) : step === 'email-verification' ? (
            <div className="flex flex-col gap-2 rounded-[22px] bg-white p-4 shadow-[0px_8px_24px_2px_rgba(0,0,0,0.06)] sm:p-5">
              <OtpVerificationForm
                email={invitedEmail}
                fromSignup
                onVerified={() => setShowSuccess(true)}
              />
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                void handleSubmit(e)
              }}
              className="flex flex-col gap-6 rounded-[22px] bg-white p-4 shadow-[0px_8px_24px_2px_rgba(0,0,0,0.06)] sm:p-5"
            >
              <p className="text-xs font-normal text-lightBlackOne sm:text-sm">
                {t('auth.acceptInvite.description', {
                  email: invitedEmail,
                  company: data?.content.companyName ?? '',
                })}
              </p>

              <PersonalInformationSection
                values={formValues}
                setField={setField}
                touched={touched}
                markTouched={markTouched}
                emailReadOnly
                showCompanyEmail={false}
              />

              <CreatePasswordSection
                values={formValues}
                setField={setField}
                touched={touched}
                markTouched={markTouched}
                checks={checks}
                passwordsMatch={passwordsMatch}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
                showConfirmPassword={showConfirmPassword}
                onToggleConfirmPassword={() => setShowConfirmPassword((prev) => !prev)}
              />

              <div className="flex flex-col gap-1">
                <div className="flex flex-row items-center gap-3">
                  <CheckboxField
                    id="accept-invite-terms"
                    checked={values.termsAccepted}
                    onChange={() => {
                      if (values.termsAccepted) {
                        setField('termsAccepted', false)
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
                {showTermsError && !values.termsAccepted ? (
                  <p className="text-xs text-red-500">{t('auth.signup.termsRequired')}</p>
                ) : null}
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}

              <div className="w-full">
                <LoginButton type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? t('auth.acceptInvite.submitting') : t('auth.acceptInvite.submit')}
                </LoginButton>
              </div>

              <div className="flex w-full flex-row items-center justify-center gap-1">
                <span className="text-xs font-normal text-greyThree sm:text-sm">
                  {t('auth.signup.alreadyHaveAccount')}
                </span>
                <Link
                  to="/login"
                  className="flex flex-row items-center text-xs font-normal text-black sm:text-sm"
                >
                  {t('auth.signup.loginLink')}
                  <ArrowUpRight className="h-5 w-5 text-black" strokeWidth={2} />
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <SignupTermsModal
        open={isTermsOpen}
        onAccept={() => {
          setField('termsAccepted', true)
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
