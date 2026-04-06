import { forwardRef, type LabelHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none text-rp-fg peer-disabled:cursor-not-allowed peer-disabled:text-rp-disabled',
      className,
    )}
    {...props}
  />
))
Label.displayName = 'Label'
