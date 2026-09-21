import { Briefcase, Hash, MapPin } from 'lucide-react'

import { CityDropdown, CountryDropdown, InputField } from '@/components/fields'
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

const BRIEFCASE_ICON = <Briefcase className="h-5 w-5 text-primary" strokeWidth={2} />
const MAP_PIN_ICON = <MapPin className="h-5 w-5 text-primary" strokeWidth={2} />
const HASH_ICON = <Hash className="h-5 w-5 text-primary" strokeWidth={2} />

export type CompanyDetailsSectionProps = {
  values: SignupFormValues
  setField: SetSignupField
  touched: Partial<Record<keyof SignupFormValues, boolean>>
  markTouched: (field: keyof SignupFormValues) => void
}

/** Figma "Company Details" block: company name, address, country/city, postal code, phone. */
export function CompanyDetailsSection({
  values,
  setField,
  touched,
  markTouched,
}: CompanyDetailsSectionProps) {
  const { t } = useI18n()

  // Country and postal code are optional. City is only required once a country
  // has been picked — "country without city" is the one combination we reject.
  const cityError =
    touched.city && values.country.trim() && !values.city.trim()
      ? t('auth.signup.required')
      : undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className={SIGNUP_SECTION_TITLE_CLASS}>{t('auth.signup.company.title')}</h3>
        <p className={SIGNUP_SECTION_DESCRIPTION_CLASS}>{t('auth.signup.company.description')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          fieldType="text"
          id="signup-company-name"
          name="companyName"
          label={t('auth.signup.companyNameLabel')}
          labelClassName={SIGNUP_LABEL_CLASS}
          containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
          className={SIGNUP_FIELD_SHELL_CLASS}
          inputClassName={SIGNUP_INPUT_CLASS}
          leftIcon={BRIEFCASE_ICON}
          placeholder={t('auth.signup.companyNamePlaceholder')}
          maxLength={50}
          value={values.companyName}
          onChange={(e) => setField('companyName', e.target.value)}
          onBlur={() => markTouched('companyName')}
          error={
            touched.companyName && !values.companyName.trim()
              ? t('auth.signup.required')
              : undefined
          }
        />

        <InputField
          fieldType="text"
          id="signup-address1"
          name="address1"
          label={t('auth.signup.address1Label')}
          labelClassName={SIGNUP_LABEL_CLASS}
          containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
          className={SIGNUP_FIELD_SHELL_CLASS}
          inputClassName={SIGNUP_INPUT_CLASS}
          leftIcon={MAP_PIN_ICON}
          placeholder={t('auth.signup.address1Placeholder')}
          value={values.address1}
          onChange={(e) => setField('address1', e.target.value)}
          onBlur={() => markTouched('address1')}
          error={
            touched.address1 && !values.address1.trim() ? t('auth.signup.required') : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-[10px]">
          <span className={SIGNUP_LABEL_CLASS}>{t('auth.signup.countryLabel')}</span>
          <CountryDropdown
            id="signup-country"
            value={values.country}
            onChange={(country) => {
              setField('country', country)
              setField('city', '')
            }}
            placeholder={t('auth.signup.countryPlaceholder')}
            backgroundColor="#F2F2F2"
            borderColor="#DADADA"
            borderRadius={5}
          />
        </div>
        <div className="flex flex-col gap-[10px]">
          <span className={SIGNUP_LABEL_CLASS}>{t('auth.signup.cityLabel')}</span>
          <CityDropdown
            id="signup-city"
            value={values.city}
            countryName={values.country}
            onChange={(city) => {
              markTouched('city')
              setField('city', city)
            }}
            placeholder={t('auth.signup.cityPlaceholder')}
            backgroundColor="#F2F2F2"
            borderColor="#DADADA"
            borderRadius={5}
          />
          {cityError ? (
            <p id="signup-city-err" role="alert" className="text-tiny font-light text-redOne">
              {cityError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          fieldType="text"
          id="signup-postal-code"
          name="postalCode"
          label={t('auth.signup.postalCodeLabel')}
          labelClassName={SIGNUP_LABEL_CLASS}
          containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
          className={SIGNUP_FIELD_SHELL_CLASS}
          inputClassName={SIGNUP_INPUT_CLASS}
          leftIcon={HASH_ICON}
          placeholder={t('auth.signup.postalCodePlaceholder')}
          value={values.postalCode}
          onChange={(e) => setField('postalCode', e.target.value)}
        />

        <div className="flex flex-col gap-[10px]">
          <span className={SIGNUP_LABEL_CLASS} id="signup-company-phone-label">
            {t('auth.signup.companyPhoneLabel')}
          </span>
          <div className="flex items-start gap-[10px]">
            <PhoneCodeDropdown
              id="signup-company-phone-code"
              value={values.companyPhoneCode}
              onChange={(code) => setField('companyPhoneCode', code)}
              size="sm"
            />
            <InputField
              fieldType="text"
              type="tel"
              id="signup-company-phone"
              name="companyPhone"
              aria-labelledby="signup-company-phone-label"
              containerClassName={`${SIGNUP_FIELD_CONTAINER_CLASS} flex-1`}
              className={SIGNUP_FIELD_SHELL_CLASS}
              inputClassName={SIGNUP_INPUT_CLASS}
              placeholder={t('auth.signup.phonePlaceholder')}
              maxLength={15}
              value={values.companyPhone}
              onChange={(e) => setField('companyPhone', e.target.value.replace(/[^\d]/g, ''))}
              onBlur={() => markTouched('companyPhone')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
