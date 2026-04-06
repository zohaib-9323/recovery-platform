import { Check, Minus } from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'

import { cn } from '@/lib/utils'

const BOX_SIZE = {
  sm: 'h-4 w-4 rounded-[4px] [&_svg]:h-2.5 [&_svg]:w-2.5',
  md: 'h-5 w-5 rounded-md [&_svg]:h-3 [&_svg]:w-3',
  lg: 'h-6 w-6 rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5',
} as const

export type CheckboxFieldSize = keyof typeof BOX_SIZE

export type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  size?: CheckboxFieldSize
  /** Sets native `indeterminate` (e.g. “some rows selected”). */
  indeterminate?: boolean
  /** Visible label text; omit when using `aria-label` only (e.g. table rows). */
  label?: ReactNode
  labelClassName?: string
  containerClassName?: string
  /** Extra classes on the outer `<label>` (e.g. table cell alignment). */
  labelLayoutClassName?: string
}

function mergeRefs<T>(a: Ref<T> | undefined, b: Ref<T> | null) {
  return (node: T | null) => {
    if (typeof a === 'function') a(node)
    else if (a) (a as React.MutableRefObject<T | null>).current = node
    if (typeof b === 'function') b(node)
    else if (b) (b as React.MutableRefObject<T | null>).current = node
  }
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField(
    {
      className,
      containerClassName,
      label,
      labelClassName,
      labelLayoutClassName,
      size = 'sm',
      indeterminate = false,
      checked,
      disabled,
      id,
      ...inputProps
    },
    ref,
  ) {
    const innerRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      const el = innerRef.current
      if (!el) return
      el.indeterminate = indeterminate
    }, [indeterminate, checked])

    const isOn = Boolean(checked) || indeterminate

    return (
      <div className={containerClassName}>
        <label
          htmlFor={label != null && label !== '' ? id : undefined}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2',
            label == null || label === '' ? 'justify-center' : 'text-sm font-medium text-rp-fg',
            disabled && 'cursor-not-allowed opacity-70',
            labelLayoutClassName,
          )}
        >
          <input
            ref={mergeRefs(ref, innerRef)}
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className={cn(
              'peer sr-only focus:outline-none',
              'focus-visible:outline-none',
              className,
            )}
            {...inputProps}
          />
          <span
            className={cn(
              'flex shrink-0 items-center justify-center border transition-colors',
              BOX_SIZE[size],
              isOn ? 'border-rp-accent bg-rp-accent' : 'border-rp-border bg-white',
              disabled && 'opacity-50',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-rp-accent peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white',
            )}
            aria-hidden
          >
            {indeterminate ? (
              <Minus className="text-white" strokeWidth={3} />
            ) : (
              <Check
                className={cn(
                  'text-white transition-opacity',
                  checked ? 'opacity-100' : 'opacity-0',
                )}
                strokeWidth={3}
              />
            )}
          </span>
          {label != null && label !== '' ? (
            <span className={cn('select-none', labelClassName)}>{label}</span>
          ) : null}
        </label>
      </div>
    )
  },
)

CheckboxField.displayName = 'CheckboxField'
