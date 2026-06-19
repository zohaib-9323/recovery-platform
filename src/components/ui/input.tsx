import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-rp-border bg-rp-input px-3 py-2 text-sm text-rp-fg shadow-sm transition-colors placeholder:text-rp-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rp-accent focus-visible:ring-offset-2 focus-visible:ring-offset-rp-bg disabled:cursor-not-allowed disabled:text-rp-disabled',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
