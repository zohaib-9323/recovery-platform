import { useState } from 'react'

import { InputField } from '@/components/fields'
import { Popup } from '@/components/popup'
import { MU } from '@/lib/manage-users-copy'
import { isValidEmail } from '@/lib/validation'

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

export type InviteUserModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (email: string) => void
}

/**
 * Figma frame 2341:1420 — 630×268 card, 20px padding, 590px content column:
 * title block, 20px gap, the email field, then a 40px gap before the footer.
 */
export function InviteUserModal({ open, onClose, onSubmit }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const emailValid = isValidEmail(email)

  const close = () => {
    setEmail('')
    setTouched(false)
    onClose()
  }

  return (
    <Popup
      open={open}
      onClose={close}
      className="max-h-[90vh] max-w-[630px] overflow-y-auto rounded-[20px] border-0 p-5"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-[10px]">
          <h2 className={USER_MODAL_TITLE_CLASS}>{MU.inviteUser}</h2>
          <p className={USER_MODAL_DESCRIPTION_CLASS}>{MU.inviteUserDesc}</p>
        </div>

        <InputField
          fieldType="email"
          id="invite-user-email"
          name="email"
          label={MU.emailAddress}
          labelClassName={USER_MODAL_LABEL_CLASS}
          containerClassName={USER_MODAL_FIELD_CONTAINER_CLASS}
          className={USER_MODAL_FIELD_SHELL_CLASS}
          inputClassName={USER_MODAL_INPUT_CLASS}
          placeholder={MU.emailPlaceholder}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && !emailValid ? MU.invalidEmail : undefined}
        />

        <div className="mt-5 flex items-center justify-end gap-[10px]">
          <button type="button" onClick={close} className={USER_MODAL_CANCEL_BUTTON_CLASS}>
            {MU.cancel}
          </button>
          <button
            type="button"
            disabled={!emailValid}
            onClick={() => {
              onSubmit(email.trim())
              close()
            }}
            className={USER_MODAL_SUBMIT_BUTTON_CLASS}
          >
            {MU.sendInvitation}
          </button>
        </div>
      </div>
    </Popup>
  )
}
