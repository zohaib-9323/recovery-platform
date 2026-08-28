import { Eye, EyeOff, KeyRound } from 'lucide-react'

import { InputField } from '@/components/fields'
import { useI18n } from '@/i18n/useI18n'
import { PasswordRules, type PasswordChecks } from '@/pages/auth/components/PasswordRules'
import {
  SIGNUP_FIELD_CONTAINER_CLASS,
  SIGNUP_FIELD_SHELL_CLASS,
  SIGNUP_INPUT_CLASS,
  SIGNUP_LABEL_CLASS,
  SIGNUP_SECTION_DESCRIPTION_CLASS,
  SIGNUP_SECTION_TITLE_CLASS,
} from '@/pages/auth/signup/signup-field-styles'
import type { SetSignupField, SignupFormValues } from '@/pages/auth/signup/signup-types'

const KEY_ICON = <KeyRound className="h-5 w-5 text-primary" strokeWidth={2} />

export type CreatePasswordSectionProps = {
  values: SignupFormValues
  setField: SetSignupField
  touched: Partial<Record<keyof SignupFormValues, boolean>>
  markTouched: (field: keyof SignupFormValues) => void
  checks: PasswordChecks
  passwordsMatch: boolean
  showPassword: boolean
  onTogglePassword: () => void
  showConfirmPassword: boolean
  onToggleConfirmPassword: () => void
}

/** Figma "Create Password" block: password + strength pills + confirm password. */
export function CreatePasswordSection({
  values,
  setField,
  touched,
  markTouched,
  checks,
  passwordsMatch,
  showPassword,
  onTogglePassword,
  showConfirmPassword,
  onToggleConfirmPassword,
}: CreatePasswordSectionProps) {
  const { t } = useI18n()
  const showConfirmHint = touched.confirmPassword && values.confirmPassword.length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className={SIGNUP_SECTION_TITLE_CLASS}>{t('auth.signup.password.title')}</h3>
        <p className={SIGNUP_SECTION_DESCRIPTION_CLASS}>{t('auth.signup.password.description')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <InputField
          fieldType="password"
          id="signup-password"
          name="password"
          label={t('auth.signup.passwordLabel')}
          labelClassName={SIGNUP_LABEL_CLASS}
          containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
          className={SIGNUP_FIELD_SHELL_CLASS}
          inputClassName={SIGNUP_INPUT_CLASS}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          leftIcon={KEY_ICON}
          placeholder={t('auth.signup.passwordPlaceholder')}
          value={values.password}
          onChange={(e) => setField('password', e.target.value)}
          onBlur={() => markTouched('password')}
          rightSlot={
            <button
              type="button"
              onClick={onTogglePassword}
              aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
              className="rounded p-1 text-primary hover:bg-lightGrey"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />
        <PasswordRules
          checks={checks}
          className="mt-0 gap-[10px]"
          pillClassName="px-[15px] py-[10px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <InputField
          fieldType="password"
          id="signup-confirm-password"
          name="confirmPassword"
          label={t('auth.signup.confirmPasswordLabel')}
          labelClassName={SIGNUP_LABEL_CLASS}
          containerClassName={SIGNUP_FIELD_CONTAINER_CLASS}
          className={SIGNUP_FIELD_SHELL_CLASS}
          inputClassName={SIGNUP_INPUT_CLASS}
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          leftIcon={KEY_ICON}
          placeholder={t('auth.signup.confirmPasswordPlaceholder')}
          value={values.confirmPassword}
          onChange={(e) => setField('confirmPassword', e.target.value)}
          onBlur={() => markTouched('confirmPassword')}
          aria-invalid={showConfirmHint && !passwordsMatch}
          rightSlot={
            <button
              type="button"
              onClick={onToggleConfirmPassword}
              aria-label={showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')}
              className="rounded p-1 text-primary hover:bg-lightGrey"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />
        {showConfirmHint ? (
          <p
            className={`text-tiny font-normal ${passwordsMatch ? 'text-greenOne' : 'text-lightBlackOne'}`}
          >
            {passwordsMatch
              ? t('auth.signup.passwordMatched')
              : t('auth.signup.passwordNotMatchedYet')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
