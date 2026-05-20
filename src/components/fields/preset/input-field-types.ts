import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export type FieldSize = 'default' | 'lg'

export type BaseInputFieldProps = {
  label?: ReactNode
  labelClassName?: string
  id?: string
  error?: string
  description?: string
  /** Shell (border wrapper) */
  className?: string
  containerClassName?: string
  size?: FieldSize
  leftIcon?: ReactNode
  rightSlot?: ReactNode
}

export type TextLikeFieldProps = BaseInputFieldProps & {
  fieldType: 'text' | 'email' | 'password'
  inputClassName?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'className'> & {
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'
  }

export type FileFieldProps = BaseInputFieldProps & {
  fieldType: 'file'
  inputClassName?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'className'>

export type RichTextFieldProps = BaseInputFieldProps & {
  fieldType: 'richtext'
  textareaClassName?: string
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'className'>

export type InputFieldProps = TextLikeFieldProps | FileFieldProps | RichTextFieldProps
