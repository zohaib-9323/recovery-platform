import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

import type {
  FileFieldProps,
  RichTextFieldProps,
  TextLikeFieldProps,
} from '@/components/fields/preset/input-field-types'

const BASE_META = [
  'fieldType',
  'label',
  'labelClassName',
  'id',
  'error',
  'description',
  'className',
  'containerClassName',
  'size',
  'leftIcon',
  'rightSlot',
] as const

function omitKeys(obj: Record<string, unknown>, extra: readonly string[]): Record<string, unknown> {
  const next = { ...obj }
  for (const k of [...BASE_META, ...extra]) {
    delete next[k]
  }
  return next
}

export function splitTextLikeNativeProps(props: TextLikeFieldProps): {
  shellClassName?: string
  containerClassName?: string
  size: TextLikeFieldProps['size']
  leftIcon: TextLikeFieldProps['leftIcon']
  rightSlot: TextLikeFieldProps['rightSlot']
  typeOverride: TextLikeFieldProps['type']
  inputClassName?: string
  inputRest: Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'className'>
} {
  const {
    className: shellClassName,
    containerClassName,
    size,
    leftIcon,
    rightSlot,
    type: typeOverride,
    inputClassName,
  } = props
  const inputRest = omitKeys(props as unknown as Record<string, unknown>, [
    'inputClassName',
    'type',
  ]) as Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'className'>
  return {
    shellClassName,
    containerClassName,
    size,
    leftIcon,
    rightSlot,
    typeOverride,
    inputClassName,
    inputRest,
  }
}

export function splitFileNativeProps(props: FileFieldProps): {
  shellClassName?: string
  containerClassName?: string
  size: FileFieldProps['size']
  leftIcon: FileFieldProps['leftIcon']
  rightSlot: FileFieldProps['rightSlot']
  inputClassName?: string
  inputRest: Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'className'>
} {
  const {
    className: shellClassName,
    containerClassName,
    size,
    leftIcon,
    rightSlot,
    inputClassName,
  } = props
  const inputRest = omitKeys(props as unknown as Record<string, unknown>, [
    'inputClassName',
  ]) as Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'className'>
  return {
    shellClassName,
    containerClassName,
    size,
    leftIcon,
    rightSlot,
    inputClassName,
    inputRest,
  }
}

export function splitRichTextNativeProps(props: RichTextFieldProps): {
  shellClassName?: string
  containerClassName?: string
  size: RichTextFieldProps['size']
  leftIcon: RichTextFieldProps['leftIcon']
  rightSlot: RichTextFieldProps['rightSlot']
  textareaClassName?: string
  textareaRest: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'className'>
} {
  const {
    className: shellClassName,
    containerClassName,
    size,
    leftIcon,
    rightSlot,
    textareaClassName,
  } = props
  const textareaRest = omitKeys(props as unknown as Record<string, unknown>, [
    'textareaClassName',
  ]) as Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'className'>
  return {
    shellClassName,
    containerClassName,
    size,
    leftIcon,
    rightSlot,
    textareaClassName,
    textareaRest,
  }
}
