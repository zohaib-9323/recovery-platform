import { type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type DropdownOption = { value: string; label: string; disabled?: boolean }

export type DropdownFieldProps = {
  label?: ReactNode
  labelClassName?: string
  id?: string
  error?: string
  description?: string
  containerClassName?: string
  /** Options for the native &lt;select&gt; */
  options: DropdownOption[]
  placeholder?: string
  size?: 'default' | 'lg'
  /** `inline`: label and control on one row (e.g. table toolbars). */
  layout?: 'stacked' | 'inline'
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>

const selectSize = {
  default: 'h-11',
  lg: 'h-12',
} as const

export function DropdownField({
  label,
  labelClassName,
  id,
  error,
  description,
  containerClassName,
  options,
  placeholder,
  className,
  size = 'default',
  layout = 'stacked',
  disabled,
  ...selectProps
}: DropdownFieldProps) {
  const invalid = Boolean(error)
  const describedBy =
    [description && id ? `${id}-desc` : '', error && id ? `${id}-err` : '']
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div
      className={cn(
        layout === 'inline' ? 'flex flex-row flex-wrap items-center gap-2' : 'flex flex-col gap-2',
        containerClassName,
      )}
    >
      {label ? (
        <Label htmlFor={id} className={cn('font-semibold text-rp-fg', labelClassName)}>
          {label}
        </Label>
      ) : null}
      {description ? (
        <p id={id ? `${id}-desc` : undefined} className="text-xs text-rp-description">
          {description}
        </p>
      ) : null}
      <div className={cn('relative', layout === 'inline' && 'min-w-0 flex-1 sm:max-w-[120px]')}>
        <select
          id={id}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(
            'w-full appearance-none rounded-[10px] border border-rp-border bg-rp-input pl-3 pr-10 text-sm text-rp-fg transition-colors focus:outline-none focus:ring-2 focus:ring-rp-accent focus:ring-offset-2 focus:ring-offset-rp-bg disabled:cursor-not-allowed disabled:text-rp-disabled',
            selectSize[size],
            invalid && 'border-red-400 focus:ring-red-500',
            className,
          )}
          {...selectProps}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 text-rp-muted"
          aria-hidden
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </div>
      {error ? (
        <p id={id ? `${id}-err` : undefined} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
