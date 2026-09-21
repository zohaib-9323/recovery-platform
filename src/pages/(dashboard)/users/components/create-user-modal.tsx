import { useMemo, useState } from 'react'
import { Eye, EyeOff, KeyRound, User } from 'lucide-react'

import { InputField } from '@/components/fields'
import { Popup } from '@/components/popup'
import { MU } from '@/lib/manage-users-copy'
import { isValidEmail, isValidPassword } from '@/lib/validation'
import { PasswordRules } from '@/pages/auth/components/PasswordRules'

import { PhoneCodeDropdown } from './phone-code-dropdown'
import {
  USER_MODAL_CANCEL_BUTTON_CLASS,
  USER_MODAL_DESCRIPTION_CLASS,
  USER_MODAL_FIELD_CONTAINER_CLASS,
  USER_MODAL_FIELD_SHELL_CLASS,
  USER_MODAL_INPUT_CLASS,
  USER_MODAL_LABEL_CLASS,
  USER_MODAL_SUBMIT_BUTTON_CLASS,
  USER_MODAL_TITLE_CLASS,
} from './user-modal-styles'

export type CreateUserValues = {
  firstName: string
  lastName: string
  email: string
  phoneCode: string
  phone: string
  password: string
}

export type CreateUserModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (values: CreateUserValues) => void
  isSubmitting?: boolean
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneCode: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

/** Yellow key/user glyphs sit in the shell's `text-rp-icon` slot. */
const USER_ICON = <User className="h-5 w-5" strokeWidth={2} />
const KEY_ICON = <KeyRound className="h-5 w-5" strokeWidth={2} />

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? MU.hidePassword : MU.showPassword}
      className="rounded p-1 text-primary hover:bg-lightGrey"
    >
      {shown ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  )
}

/**
 * Figma frame 2341:1347 — 518×725 card, 20px padding, 478px content column.
 * Blocks are 20px apart, label→control is 10px, controls are 40px tall, and the
 * footer sits 40px below the last field.
 * Width widened to 630px to match the Invite User modal (see invite-user-modal.tsx).
 */
export function CreateUserModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateUserModalProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Modal stays mounted across opens (parent toggles `open`), so reset the
  // form once it closes rather than on every submit — closing now happens
  // only after the create mutation actually succeeds. Reset happens during
  // render (rather than in an effect) to avoid an extra cascading render.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setForm(EMPTY_FORM)
      setTouched({})
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }

  const setField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const markTouched = (field: keyof typeof EMPTY_FORM) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const checks = useMemo(
    () => ({
      length: form.password.length >= 8,
      lower: /[a-z]/.test(form.password),
      upper: /[A-Z]/.test(form.password),
      special: /[^A-Za-z0-9]/.test(form.password),
      digit: /\d/.test(form.password),
    }),
    [form.password],
  )

  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword
  const canSubmit =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    isValidEmail(form.email) &&
    isValidPassword(form.password) &&
    passwordsMatch

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  return (
    <Popup
      open={open}
      onClose={close}
      closeOnBackdrop={false}
      className="max-h-[90vh] max-w-[630px] overflow-y-auto rounded-[20px] border-0 p-5"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-[10px]">
          <h2 className={USER_MODAL_TITLE_CLASS}>{MU.createUser}</h2>
          <p className={USER_MODAL_DESCRIPTION_CLASS}>{MU.createUserDesc}</p>
        </div>

        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-col gap-[10px] sm:flex-row">
            <InputField
              fieldType="text"
              id="create-user-first-name"
              name="firstName"
              label={MU.firstName}
              labelClassName={USER_MODAL_LABEL_CLASS}
              containerClassName={`${USER_MODAL_FIELD_CONTAINER_CLASS} min-w-0 flex-1`}
              className={USER_MODAL_FIELD_SHELL_CLASS}
              inputClassName={USER_MODAL_INPUT_CLASS}
              leftIcon={USER_ICON}
              placeholder={MU.enterFirstName}
              maxLength={25}
              value={form.firstName}
              onChange={(event) => setField('firstName', event.target.value)}
              onBlur={() => markTouched('firstName')}
              error={touched.firstName && !form.firstName.trim() ? MU.required : undefined}
            />
            <InputField
              fieldType="text"
              id="create-user-last-name"
              name="lastName"
              label={MU.lastName}
              labelClassName={USER_MODAL_LABEL_CLASS}
              containerClassName={`${USER_MODAL_FIELD_CONTAINER_CLASS} min-w-0 flex-1`}
              className={USER_MODAL_FIELD_SHELL_CLASS}
              inputClassName={USER_MODAL_INPUT_CLASS}
              leftIcon={USER_ICON}
              placeholder={MU.enterLastName}
              maxLength={25}
              value={form.lastName}
              onChange={(event) => setField('lastName', event.target.value)}
              onBlur={() => markTouched('lastName')}
              error={touched.lastName && !form.lastName.trim() ? MU.required : undefined}
            />
          </div>

          <InputField
            fieldType="email"
            id="create-user-email"
            name="email"
            label={MU.emailAddress}
            labelClassName={USER_MODAL_LABEL_CLASS}
            containerClassName={USER_MODAL_FIELD_CONTAINER_CLASS}
            className={USER_MODAL_FIELD_SHELL_CLASS}
            inputClassName={USER_MODAL_INPUT_CLASS}
            placeholder={MU.emailPlaceholder}
            autoComplete="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
            onBlur={() => markTouched('email')}
            error={touched.email && !isValidEmail(form.email) ? MU.invalidEmail : undefined}
          />

          <div className="flex flex-col gap-[10px]">
            <span className={USER_MODAL_LABEL_CLASS} id="create-user-phone-label">
              {MU.phoneNumber}
            </span>
            <div className="flex items-start gap-[10px]">
              <PhoneCodeDropdown
                id="create-user-phone-code"
                value={form.phoneCode}
                onChange={(code) => setField('phoneCode', code)}
              />
              <InputField
                fieldType="text"
                type="tel"
                id="create-user-phone"
                name="phone"
                aria-labelledby="create-user-phone-label"
                containerClassName={`${USER_MODAL_FIELD_CONTAINER_CLASS} flex-1`}
                className={USER_MODAL_FIELD_SHELL_CLASS}
                inputClassName={USER_MODAL_INPUT_CLASS}
                placeholder={MU.enterPhoneNumber}
                maxLength={12}
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[10px]">
          <h3 className={USER_MODAL_TITLE_CLASS}>{MU.createPassword}</h3>
          <p className={USER_MODAL_DESCRIPTION_CLASS}>{MU.createPasswordDesc}</p>
        </div>

        <div className="flex flex-col gap-[10px]">
          <InputField
            fieldType="password"
            id="create-user-password"
            name="password"
            label={MU.password}
            labelClassName={USER_MODAL_LABEL_CLASS}
            containerClassName={USER_MODAL_FIELD_CONTAINER_CLASS}
            className={USER_MODAL_FIELD_SHELL_CLASS}
            inputClassName={USER_MODAL_INPUT_CLASS}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            leftIcon={KEY_ICON}
            placeholder={MU.enterPassword}
            value={form.password}
            onChange={(event) => setField('password', event.target.value)}
            onBlur={() => markTouched('password')}
            aria-invalid={form.password.length > 0 && !isValidPassword(form.password)}
            rightSlot={
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
              />
            }
          />

          <PasswordRules
            checks={checks}
            className="mt-0 gap-[10px]"
            pillClassName="px-[15px] py-[10px]"
          />
        </div>

        <InputField
          fieldType="password"
          id="create-user-confirm-password"
          name="confirmPassword"
          label={MU.confirmPassword}
          labelClassName={USER_MODAL_LABEL_CLASS}
          containerClassName={USER_MODAL_FIELD_CONTAINER_CLASS}
          className={USER_MODAL_FIELD_SHELL_CLASS}
          inputClassName={USER_MODAL_INPUT_CLASS}
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          leftIcon={KEY_ICON}
          placeholder={MU.confirmPassword}
          value={form.confirmPassword}
          onChange={(event) => setField('confirmPassword', event.target.value)}
          onBlur={() => markTouched('confirmPassword')}
          error={
            touched.confirmPassword && form.confirmPassword.length > 0 && !passwordsMatch
              ? MU.passwordsDoNotMatch
              : undefined
          }
          rightSlot={
            <PasswordToggle
              shown={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
            />
          }
        />

        <div className="mt-5 flex items-center justify-end gap-[10px]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={close}
            className={USER_MODAL_CANCEL_BUTTON_CLASS}
          >
            {MU.cancel}
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={() => {
              onSubmit({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phoneCode: form.phoneCode,
                phone: form.phone,
                password: form.password,
              })
            }}
            className={USER_MODAL_SUBMIT_BUTTON_CLASS}
          >
            {isSubmitting ? (
              <div className="flex h-5 w-5 animate-spin items-center justify-center rounded-full border-2 border-white border-t-transparent" />
            ) : (
              MU.createAndNotify
            )}
          </button>
        </div>
      </div>
    </Popup>
  )
}
