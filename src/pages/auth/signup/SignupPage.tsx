import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useRegisterMutation } from '@/app/services/recoveryApi'
import { LoginButton } from '@/components/buttons'
import { CheckboxField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { isConflictError } from '@/lib/api-error'
import { findScrollableAncestor } from '@/lib/scrollable-ancestor'
import { showCustomToast } from '@/lib/showCustomToast'
import { extractSubdomainFromHostname } from '@/lib/tenantTheme'
import { isValidEmail, isValidPassword } from '@/lib/validation'
import {
  OtpVerificationForm,
  type OtpVerifiedResult,
} from '@/pages/auth/components/OtpVerificationForm'
import { PasswordSuccessPopup } from '@/pages/auth/components/PasswordSuccessPopup'
import { clearFirstLoginFlowState, saveFirstLoginFlowState } from '@/pages/auth/first-login-flow'
import { SignupStepper, type SignupStep } from '@/pages/auth/signup/SignupStepper'
import { SignupTermsModal } from '@/pages/auth/signup/SignupTermsModal'
import { CompanyDetailsSection } from '@/pages/auth/signup/components/CompanyDetailsSection'
import { CreatePasswordSection } from '@/pages/auth/signup/components/CreatePasswordSection'
import { PersonalInformationSection } from '@/pages/auth/signup/components/PersonalInformationSection'
import {
  EMPTY_SIGNUP_FORM,
  type SignupFieldName,
  type SignupFormValues,
} from '@/pages/auth/signup/signup-types'
import { env } from '@/utils/env'

/**
 * Recovery self-signup — trade-harmonizer's registration journey
 * (`(auth)/(signup)/registration/`) minus the subscription/payment step.
 *
 * ## Two structural rules, both load-bearing
 *
 * 1. **This page owns no scroll container.** `AuthLayout`'s signup shell has
 *    the single `overflow-y-auto`, exactly as trade-harmonizer's
 *    `(auth)/(signup)/layout.tsx` does. A nested scroller here previously split
 *    the scrolling between two elements and put the top of a long form out of
 *    reach.
 * 2. **The terms modal is portalled to `document.body`** (see
 *    `SignupTermsModal`). Rendered inline it is a child of whatever scrolls
 *    this page, and mounting it moved that scroll position.
 *
 * `SignupPage.test.tsx` asserts both. Breaking either brings back a bug that
 * took four attempts to pin down.
 *
 * Every field collected here is sent to `POST /recovery/auth/register`; the
 * backend DTO declares all of them. Do not add a field without adding it to
 * `RegisterRecoveryUserDto` — the API runs with `forbidNonWhitelisted`, so an
 * undeclared property fails the whole request rather than being ignored.
 */
export function SignupPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  // Always starts on step 1 — a leftover `fromSignup` flow state from a
  // previous, possibly abandoned signup attempt must never hijack a fresh
  // visit to /signup into the OTP step.
  const [step, setStep] = useState<SignupStep>('personal-info')
  const [otpEmail, setOtpEmail] = useState('')
  const [showSignupVerifiedPopup, setShowSignupVerifiedPopup] = useState(false)

  const [values, setValues] = useState<SignupFormValues>(EMPTY_SIGNUP_FORM)
  const [touched, setTouched] = useState<Partial<Record<SignupFieldName, boolean>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [showTermsError, setShowTermsError] = useState(false)
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const rootRef = useRef<HTMLDivElement>(null)

  // Pin the form's scroll position for as long as the terms modal is open.
  //
  // The background moving when the modal opened survived four attempts at
  // finding the mechanism (a body lock, a page-root lock, a shell rewrite, and
  // portalling the overlay out of the scroller). Rather than keep guessing at
  // the cause, this enforces the invariant directly: whatever tries to move the
  // scroller — focus, scroll anchoring, chaining, a layout pass — is undone on
  // the same frame. A modal should not let the page behind it move anyway.
  //
  // Which element scrolls this page is a layout detail that has already moved
  // twice, so resolve it at runtime rather than assuming document.body, which
  // does not scroll at all under the auth shell.
  useEffect(() => {
    if (!isTermsOpen) return undefined
    const scroller = findScrollableAncestor(rootRef.current)
    if (!scroller) return undefined

    const pinnedAt = scroller.scrollTop
    const hold = () => {
      if (scroller.scrollTop !== pinnedAt) {
        scroller.scrollTop = pinnedAt
      }
    }

    scroller.addEventListener('scroll', hold)
    // Catch a jump that happens during the same frame the modal mounts, which
    // fires no scroll event of its own.
    const frame = requestAnimationFrame(hold)

    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', hold)
      requestAnimationFrame(() => {
        scroller.scrollTop = pinnedAt
      })
    }
  }, [isTermsOpen])

  /**
   * A 409 from /register — the address is taken, or its company domain is
   * already claimed by someone else. Held separately from the client-side
   * validation errors because only the server can know it, and it has to
   * survive the toast disappearing: "ask your company owner to invite you" is
   * an instruction the user needs to still be able to read.
   */
  const [emailServerError, setEmailServerError] = useState<string | undefined>(undefined)

  const setField: <K extends SignupFieldName>(field: K, value: SignupFormValues[K]) => void = (
    field,
    value,
  ) => {
    // Editing the email invalidates whatever the server said about the old
    // one; leaving it up would keep a resolved error pinned to a valid field.
    if (field === 'email') {
      setEmailServerError(undefined)
    }
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const markTouched = (field: SignupFieldName) => {
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

  const emailError =
    emailServerError ??
    (values.email.length > 0 && !isValidEmail(values.email)
      ? t('auth.login.enterValidEmail')
      : undefined)
  const companyEmailError =
    values.companyEmail.length > 0 && !isValidEmail(values.companyEmail)
      ? t('auth.login.enterValidEmail')
      : undefined

  /** Every field that blocks submission. `REQUIRED_FIELDS` mirrors it exactly. */
  const canSubmit =
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    isValidEmail(values.email) &&
    values.phone.trim().length > 0 &&
    isValidEmail(values.companyEmail) &&
    isValidPassword(values.password) &&
    passwordsMatch &&
    values.companyName.trim().length > 0 &&
    values.address1.trim().length > 0 &&
    values.country.trim().length > 0 &&
    values.city.trim().length > 0 &&
    values.postalCode.trim().length > 0 &&
    values.companyPhone.trim().length > 0 &&
    values.termsAccepted

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Must stay in step with `canSubmit`. A field that blocks submission
    // without being marked touched shows no error, so the form silently
    // refuses with nothing indicating which field is at fault.
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      companyEmail: true,
      password: true,
      confirmPassword: true,
      companyName: true,
      address1: true,
      country: true,
      city: true,
      postalCode: true,
      companyPhone: true,
    })
    setShowTermsError(!values.termsAccepted)

    if (!canSubmit) {
      showCustomToast({
        type: 'error',
        title: t('auth.signup.fixFieldsTitle'),
        message: t('auth.signup.fixFields'),
      })
      return
    }

    const email = values.email.trim()
    const phone = values.phone.trim()
    const companyPhone = values.companyPhone.trim()
    // trade-harmonizer sends the dial code and number as one string.
    const phoneWithCode = phone ? `${values.phoneCode}${phone}` : ''
    const companyPhoneWithCode = companyPhone ? `${values.companyPhoneCode}${companyPhone}` : ''
    // White-label signups must carry their subdomain, or the account is never
    // linked to the tenant and RecoveryTenant.userCount never increments.
    const tenant =
      typeof window === 'undefined'
        ? null
        : extractSubdomainFromHostname(window.location.hostname, env.mainSiteUrl)

    try {
      await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email,
        phone: phoneWithCode,
        password: values.password,
        companyName: values.companyName.trim(),
        termsAccepted: values.termsAccepted,
        companyEmail: values.companyEmail.trim(),
        companyWebsite: values.companyWebsite.trim(),
        address1: values.address1.trim(),
        country: values.country.trim(),
        city: values.city.trim(),
        postalCode: values.postalCode.trim(),
        companyPhone: companyPhoneWithCode,
        status: values.status,
        ...(tenant ? { tenant } : {}),
      }).unwrap()

      saveFirstLoginFlowState({ email, fromSignup: true })
      setOtpEmail(email)
      setStep('email-verification')
    } catch (err) {
      const message = getRtkErrorMessage(err)
      if (isConflictError(err)) {
        setEmailServerError(message)
      }
      showCustomToast({
        type: 'error',
        title: t('auth.signup.fixFieldsTitle'),
        message,
      })
    }
  }

  const handleRestartSignup = () => {
    clearFirstLoginFlowState()
    setValues(EMPTY_SIGNUP_FORM)
    setTouched({})
    setShowTermsError(false)
    setOtpEmail('')
    setStep('personal-info')
  }

  const handleOtpVerified = (result: OtpVerifiedResult) => {
    if (!result.fromSignup) return
    clearFirstLoginFlowState()
    setShowSignupVerifiedPopup(true)
  }

  return (
    // No `overflow-*` here on purpose — see rule 1 in the block comment above.
    <div ref={rootRef} className="w-full px-5 py-6 sm:px-7 md:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <SignupStepper activeStep={step} />

        {step === 'email-verification' ? (
          <div className="flex flex-col gap-2 rounded-[22px] bg-white p-4 shadow-[0px_8px_24px_2px_rgba(0,0,0,0.06)] sm:p-5">
            <OtpVerificationForm
              email={otpEmail}
              fromSignup
              onVerified={handleOtpVerified}
              onRestartSignup={handleRestartSignup}
            />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
            className="flex flex-col gap-6 rounded-[22px] bg-white p-4 shadow-[0px_8px_24px_2px_rgba(0,0,0,0.06)] sm:p-5"
          >
            <PersonalInformationSection
              values={values}
              setField={setField}
              touched={touched}
              markTouched={markTouched}
              emailError={emailError}
              companyEmailError={companyEmailError}
            />

            <CreatePasswordSection
              values={values}
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

            <CompanyDetailsSection
              values={values}
              setField={setField}
              touched={touched}
              markTouched={markTouched}
            />

            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center gap-3">
                <CheckboxField
                  id="signup-terms"
                  boxClassName="border-inputBorder"
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

            <div className="w-full">
              <LoginButton type="submit" disabled={!canSubmit || isRegistering}>
                {isRegistering ? t('auth.signup.submitting') : t('auth.signup.submit')}
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

      <SignupTermsModal
        open={isTermsOpen}
        onAccept={() => {
          setField('termsAccepted', true)
          setShowTermsError(false)
          setIsTermsOpen(false)
        }}
        onClose={() => setIsTermsOpen(false)}
      />

      {showSignupVerifiedPopup ? (
        <PasswordSuccessPopup
          title={t('auth.signup.otp.successTitle')}
          description={t('auth.signup.otp.successDescription')}
          actionLabel={t('auth.signup.otp.successAction')}
          onAction={() => navigate('/login', { replace: true })}
        />
      ) : null}
    </div>
  )
}
