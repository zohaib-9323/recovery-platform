import { type FormEvent, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useRegisterMutation } from '@/app/services/recoveryApi'
import { CheckboxField } from '@/components/fields'
import { LoginButton } from '@/components/buttons'
import { useI18n } from '@/i18n/useI18n'
import { isValidEmail, isValidPassword } from '@/lib/validation'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { showCustomToast } from '@/lib/showCustomToast'
import { saveFirstLoginFlowState } from '@/pages/auth/first-login-flow'
import { CompanyDetailsSection } from '@/pages/auth/signup/components/CompanyDetailsSection'
import { CreatePasswordSection } from '@/pages/auth/signup/components/CreatePasswordSection'
import { PersonalInformationSection } from '@/pages/auth/signup/components/PersonalInformationSection'
import { SignupStepper } from '@/pages/auth/signup/SignupStepper'
import { SignupTermsModal } from '@/pages/auth/signup/SignupTermsModal'
import {
  EMPTY_SIGNUP_FORM,
  type SignupFieldName,
  type SignupFormValues,
} from '@/pages/auth/signup/signup-types'

export function SignupPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [values, setValues] = useState<SignupFormValues>(EMPTY_SIGNUP_FORM)
  const [touched, setTouched] = useState<Partial<Record<SignupFieldName, boolean>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [showTermsError, setShowTermsError] = useState(false)
  const [register, { isLoading: isRegistering }] = useRegisterMutation()

  const setField: <K extends SignupFieldName>(field: K, value: SignupFormValues[K]) => void = (
    field,
    value,
  ) => {
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
    values.email.length > 0 && !isValidEmail(values.email)
      ? t('auth.login.enterValidEmail')
      : undefined
  const companyEmailError =
    values.companyEmail.length > 0 && !isValidEmail(values.companyEmail)
      ? t('auth.login.enterValidEmail')
      : undefined

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

    try {
      await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email,
        phone: values.phone.trim(),
        password: values.password,
        companyName: values.companyName.trim(),
        termsAccepted: values.termsAccepted,
      }).unwrap()

      saveFirstLoginFlowState({ email, fromSignup: true })
      navigate('/first-login/verify-otp', { replace: true, state: { email, fromSignup: true } })
    } catch (err) {
      showCustomToast({
        type: 'error',
        title: t('auth.signup.fixFieldsTitle'),
        message: getRtkErrorMessage(err),
      })
    }
  }

  return (
    <div className="h-full w-full overflow-y-auto px-5 py-6 sm:px-7 md:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <SignupStepper activeStep="personal-info" />

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
              {t('auth.signup.submit')}
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
    </div>
  )
}
