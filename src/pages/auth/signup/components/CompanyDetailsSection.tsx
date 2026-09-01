import { Building2 } from 'lucide-react'

import { InputField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import {
  SIGNUP_FIELD_CONTAINER_CLASS,
  SIGNUP_FIELD_SHELL_CLASS,
  SIGNUP_INPUT_CLASS,
  SIGNUP_LABEL_CLASS,
  SIGNUP_SECTION_DESCRIPTION_CLASS,
  SIGNUP_SECTION_TITLE_CLASS,
} from '@/pages/auth/signup/signup-field-styles'
import type { SetSignupField, SignupFormValues } from '@/pages/auth/signup/signup-types'

const COMPANY_ICON = <Building2 className="h-5 w-5 text-primary" strokeWidth={2} />

export type CompanyDetailsSectionProps = {
  values: SignupFormValues
  setField: SetSignupField
  touched: Partial<Record<keyof SignupFormValues, boolean>>
  markTouched: (field: keyof SignupFormValues) => void
}

/**
 * "Company Details" block — company name only.
 *
 * This section previously collected a website, two address lines, country,
 * city, postal code, a company phone and a status. `RegisterRecoveryUserDto`
 * accepts none of them, so they blocked submission and were then thrown away.
 * trade-harmonizer's registration asks for the company name and nothing else
 * at signup; the rest belongs in company profile settings, after the account
 * exists.
 */
export function CompanyDetailsSection({
  values,
  setField,
  touched,
  markTouched,
}: CompanyDetailsSectionProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className={SIGNUP_SECTION_TITLE_CLASS}>{t('auth.signup.company.title')}</h3>
        <p className={SIGNUP_SECTION_DESCRIPTION_CLASS}>{t('auth.signup.company.description')}</p>
      </div>

      <InputField
        fieldType="text"
        id="signup-company-name"
        name="companyName"
        label={t('auth.signup.companyNameLabel')}
        labelClassName={SIGNUP_LABEL_CLASS}
        containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
        className={SIGNUP_FIELD_SHELL_CLASS}
        inputClassName={SIGNUP_INPUT_CLASS}
        leftIcon={COMPANY_ICON}
        placeholder={t('auth.signup.companyNamePlaceholder')}
        maxLength={100}
        value={values.companyName}
        onChange={(e) => setField('companyName', e.target.value)}
        onBlur={() => markTouched('companyName')}
        error={
          touched.companyName && !values.companyName.trim() ? t('auth.signup.required') : undefined
        }
      />
    </div>
  )
}
