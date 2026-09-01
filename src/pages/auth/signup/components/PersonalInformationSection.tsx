import { Mail, User } from 'lucide-react'

import { InputField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { PhoneCodeDropdown } from '@/pages/(dashboard)/users/components/phone-code-dropdown'
import {
  SIGNUP_FIELD_CONTAINER_CLASS,
  SIGNUP_FIELD_SHELL_CLASS,
  SIGNUP_INPUT_CLASS,
  SIGNUP_LABEL_CLASS,
  SIGNUP_SECTION_DESCRIPTION_CLASS,
  SIGNUP_SECTION_TITLE_CLASS,
} from '@/pages/auth/signup/signup-field-styles'
import type { SetSignupField, SignupFormValues } from '@/pages/auth/signup/signup-types'

const USER_ICON = <User className="h-5 w-5 text-primary" strokeWidth={2} />
const MAIL_ICON = <Mail className="h-5 w-5 text-primary" strokeWidth={2} />

export type PersonalInformationSectionProps = {
  values: SignupFormValues
  setField: SetSignupField
  touched: Partial<Record<keyof SignupFormValues, boolean>>
  markTouched: (field: keyof SignupFormValues) => void
  emailError?: string
  companyEmailError?: string
}

/** Figma "Personal Information" block: name/email/phone + company email. */
export function PersonalInformationSection({
  values,
  setField,
  touched,
  markTouched,
  emailError,
  companyEmailError,
}: PersonalInformationSectionProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className={SIGNUP_SECTION_TITLE_CLASS}>{t('auth.signup.personalInfo.title')}</h3>
        <p className={SIGNUP_SECTION_DESCRIPTION_CLASS}>
          {t('auth.signup.personalInfo.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          fieldType="text"
          id="signup-first-name"
          name="firstName"
          label={t('auth.signup.firstNameLabel')}
          labelClassName={SIGNUP_LABEL_CLASS}
          containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
          className={SIGNUP_FIELD_SHELL_CLASS}
          inputClassName={SIGNUP_INPUT_CLASS}
          leftIcon={USER_ICON}
          placeholder={t('auth.signup.firstNamePlaceholder')}
          maxLength={25}
          value={values.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          onBlur={() => markTouched('firstName')}
          error={
            touched.firstName && !values.firstName.trim() ? t('auth.signup.required') : undefined
          }
        />
        <InputField
          fieldType="text"
          id="signup-last-name"
          name="lastName"
          label={t('auth.signup.lastNameLabel')}
          labelClassName={SIGNUP_LABEL_CLASS}
          containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
          className={SIGNUP_FIELD_SHELL_CLASS}
          inputClassName={SIGNUP_INPUT_CLASS}
          leftIcon={USER_ICON}
          placeholder={t('auth.signup.lastNamePlaceholder')}
          maxLength={25}
          value={values.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          onBlur={() => markTouched('lastName')}
          error={
            touched.lastName && !values.lastName.trim() ? t('auth.signup.required') : undefined
          }
        />
      </div>

      <InputField
        fieldType="email"
        id="signup-email"
        name="email"
        label={t('auth.signup.emailLabel')}
        labelClassName={SIGNUP_LABEL_CLASS}
        containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
        className={SIGNUP_FIELD_SHELL_CLASS}
        inputClassName={SIGNUP_INPUT_CLASS}
        leftIcon={MAIL_ICON}
        autoComplete="email"
        placeholder={t('auth.signup.emailPlaceholder')}
        value={values.email}
        onChange={(e) => setField('email', e.target.value.replace(/\s/g, ''))}
        onBlur={() => markTouched('email')}
        error={touched.email ? emailError : undefined}
        aria-invalid={Boolean(touched.email && emailError)}
      />

      <div className="flex flex-col gap-[10px]">
        <span className={SIGNUP_LABEL_CLASS} id="signup-phone-label">
          {t('auth.signup.phoneLabel')}
        </span>
        <div className="flex items-start gap-[10px]">
          <PhoneCodeDropdown
            id="signup-phone-code"
            value={values.phoneCode}
            onChange={(code) => setField('phoneCode', code)}
            size="sm"
          />
          <InputField
            fieldType="text"
            type="tel"
            id="signup-phone"
            name="phone"
            aria-labelledby="signup-phone-label"
            containerClassName={`${SIGNUP_FIELD_CONTAINER_CLASS} flex-1`}
            className={SIGNUP_FIELD_SHELL_CLASS}
            inputClassName={SIGNUP_INPUT_CLASS}
            placeholder={t('auth.signup.phonePlaceholder')}
            maxLength={15}
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value.replace(/[^\d]/g, ''))}
            onBlur={() => markTouched('phone')}
          />
        </div>
      </div>

      <InputField
        fieldType="email"
        id="signup-company-email"
        name="companyEmail"
        label={t('auth.signup.companyEmailLabel')}
        labelClassName={SIGNUP_LABEL_CLASS}
        containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
        className={SIGNUP_FIELD_SHELL_CLASS}
        inputClassName={SIGNUP_INPUT_CLASS}
        leftIcon={MAIL_ICON}
        placeholder={t('auth.signup.companyEmailPlaceholder')}
        value={values.companyEmail}
        onChange={(e) => setField('companyEmail', e.target.value.replace(/\s/g, ''))}
        onBlur={() => markTouched('companyEmail')}
        error={touched.companyEmail ? companyEmailError : undefined}
        aria-invalid={Boolean(touched.companyEmail && companyEmailError)}
      />
    </div>
  )
}
