import { forwardRef, type InputHTMLAttributes } from 'react'

import { InputField } from '@/components/fields/preset/input-field'
import type { TextLikeFieldProps } from '@/components/fields/preset/input-field-types'

/**
 * Legacy text-like field wrapper. Prefer `InputField` from `@/components/fields` with an explicit
 * `fieldType` (`text` | `email` | `password` | `file` | `richtext`).
 */
export type FieldInputProps = Omit<TextLikeFieldProps, 'fieldType'> & {
  fieldType?: 'text' | 'email' | 'password'
  type?: InputHTMLAttributes<HTMLInputElement>['type']
}

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(function FieldInput(
  { fieldType, type: typeProp, ...props },
  ref,
) {
  const ft =
    fieldType ?? (typeProp === 'email' ? 'email' : typeProp === 'password' ? 'password' : 'text')
  return <InputField ref={ref} fieldType={ft} type={typeProp} {...props} />
})
FieldInput.displayName = 'FieldInput'
