import { forwardRef, type Ref } from 'react'

import {
  splitFileNativeProps,
  splitRichTextNativeProps,
  splitTextLikeNativeProps,
} from '@/components/fields/lib/split-native-props'
import type {
  FileFieldProps,
  InputFieldProps,
  RichTextFieldProps,
  TextLikeFieldProps,
} from '@/components/fields/preset/input-field-types'
import { FieldControlShell } from '@/components/fields/lib/field-control-shell'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const INPUT_BASE_CLASS =
  'min-w-0 flex-1 border-0 bg-transparent text-sm text-rp-fg placeholder:text-rp-disabled focus:outline-none disabled:cursor-not-allowed disabled:text-rp-disabled'

function resolveInputType(
  fieldType: 'text' | 'email' | 'password',
  typeOverride: TextLikeFieldProps['type'],
): 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' {
  if (fieldType === 'email') return 'email'
  if (fieldType === 'password') return typeOverride === 'text' ? 'text' : 'password'
  return typeOverride ?? 'text'
}

export const InputField = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputFieldProps>(
  function InputField(props, ref) {
    const { fieldType } = props
    const invalid = Boolean(props.error) || props['aria-invalid'] === true
    const describedBy =
      [
        props.description && props.id ? `${props.id}-desc` : '',
        props.error && props.id ? `${props.id}-err` : '',
      ]
        .filter(Boolean)
        .join(' ') || undefined

    const labelNode = props.label ? (
      <Label htmlFor={props.id} className={cn('font-semibold text-rp-fg', props.labelClassName)}>
        {props.label}
      </Label>
    ) : null

    if (fieldType === 'richtext') {
      const p = props as RichTextFieldProps
      const {
        shellClassName,
        containerClassName,
        size,
        leftIcon,
        rightSlot,
        textareaClassName,
        textareaRest,
      } = splitRichTextNativeProps(p)
      return (
        <div className={cn('flex flex-col gap-2', containerClassName)}>
          {labelNode}
          {props.description ? (
            <p
              id={props.id ? `${props.id}-desc` : undefined}
              className="text-xs text-rp-description"
            >
              {props.description}
            </p>
          ) : null}
          <FieldControlShell
            size={size ?? 'default'}
            align="start"
            invalid={invalid}
            className={shellClassName}
            leftIcon={leftIcon}
            rightSlot={rightSlot}
          >
            <textarea
              ref={ref as Ref<HTMLTextAreaElement>}
              id={props.id}
              rows={textareaRest.rows ?? 5}
              className={cn(
                INPUT_BASE_CLASS,
                'min-h-[120px] resize-y leading-relaxed',
                textareaClassName,
              )}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...textareaRest}
            />
          </FieldControlShell>
          {props.error ? (
            <p
              id={props.id ? `${props.id}-err` : undefined}
              role="alert"
              className="text-sm text-red-600"
            >
              {props.error}
            </p>
          ) : null}
        </div>
      )
    }

    if (fieldType === 'file') {
      const p = props as FileFieldProps
      const {
        shellClassName,
        containerClassName,
        size,
        leftIcon,
        rightSlot,
        inputClassName,
        inputRest,
      } = splitFileNativeProps(p)
      return (
        <div className={cn('flex flex-col gap-2', containerClassName)}>
          {labelNode}
          {props.description ? (
            <p
              id={props.id ? `${props.id}-desc` : undefined}
              className="text-xs text-rp-description"
            >
              {props.description}
            </p>
          ) : null}
          <FieldControlShell
            size={size ?? 'default'}
            align="center"
            invalid={invalid}
            className={cn('h-auto min-h-11 py-2', shellClassName)}
            leftIcon={leftIcon}
            rightSlot={rightSlot}
          >
            <input
              ref={ref as Ref<HTMLInputElement>}
              id={props.id}
              type="file"
              className={cn(
                'min-w-0 flex-1 cursor-pointer text-sm file:mr-3 file:rounded-md file:border-0 file:bg-rp-accent file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-rp-accent-dark',
                INPUT_BASE_CLASS,
                inputClassName,
              )}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              {...inputRest}
            />
          </FieldControlShell>
          {props.error ? (
            <p
              id={props.id ? `${props.id}-err` : undefined}
              role="alert"
              className="text-sm text-red-600"
            >
              {props.error}
            </p>
          ) : null}
        </div>
      )
    }

    const p = props as TextLikeFieldProps
    const {
      shellClassName,
      containerClassName,
      size,
      leftIcon,
      rightSlot,
      typeOverride,
      inputClassName,
      inputRest,
    } = splitTextLikeNativeProps(p)
    const inputType = resolveInputType(fieldType, typeOverride)

    return (
      <div className={cn('flex flex-col gap-2', containerClassName)}>
        {labelNode}
        {props.description ? (
          <p id={props.id ? `${props.id}-desc` : undefined} className="text-xs text-rp-description">
            {props.description}
          </p>
        ) : null}
        <FieldControlShell
          size={size ?? 'default'}
          align="center"
          invalid={invalid}
          className={shellClassName}
          leftIcon={leftIcon}
          rightSlot={rightSlot}
        >
          <input
            ref={ref as Ref<HTMLInputElement>}
            id={props.id}
            type={inputType}
            className={cn(INPUT_BASE_CLASS, inputClassName)}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            {...inputRest}
          />
        </FieldControlShell>
        {props.error ? (
          <p
            id={props.id ? `${props.id}-err` : undefined}
            role="alert"
            className="text-sm text-red-600"
          >
            {props.error}
          </p>
        ) : null}
      </div>
    )
  },
)

InputField.displayName = 'InputField'
