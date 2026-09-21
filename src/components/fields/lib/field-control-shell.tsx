import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const fieldControlVariants = cva(
  'flex w-full items-center gap-2 rounded-[10px] border border-rp-border bg-rp-input px-3 transition-colors focus-within:ring-2 focus-within:ring-rp-accent focus-within:ring-offset-2 focus-within:ring-offset-rp-bg',
  {
    variants: {
      size: {
        default: 'h-11',
        lg: 'h-12',
      },
      align: {
        center: 'items-center',
        start: 'items-start py-2',
      },
    },
    defaultVariants: {
      size: 'default',
      align: 'center',
    },
  },
)

/**
 * Error styling, matching trade-harmonizer's `InputField` (red border over a
 * light red fill). Applied *after* the caller's `className` so a page-level
 * border/background override — e.g. `AUTH_FIELD_SHELL_CLASS` — can't win the
 * tailwind-merge conflict and silently leave an invalid field looking normal.
 */
export const fieldControlInvalidClass =
  'border-redOne bg-lightRed focus-within:border-redOne focus-within:ring-redOne'

export type FieldControlShellProps = VariantProps<typeof fieldControlVariants> & {
  className?: string
  invalid?: boolean
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  children: ReactNode
}

export function FieldControlShell({
  className,
  size,
  align,
  invalid,
  leftIcon,
  rightSlot,
  children,
}: FieldControlShellProps) {
  return (
    <div
      className={cn(
        fieldControlVariants({ size, align }),
        className,
        invalid && fieldControlInvalidClass,
      )}
    >
      {leftIcon ? (
        <span
          className={cn('flex shrink-0 text-rp-icon [&_svg]:size-5', align === 'start' && 'mt-0.5')}
          aria-hidden
        >
          {leftIcon}
        </span>
      ) : null}
      {children}
      {rightSlot ? <span className="flex shrink-0 items-center">{rightSlot}</span> : null}
    </div>
  )
}
