import { forwardRef } from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LoginButtonProps = Omit<ButtonProps, 'variant'>

/**
 * Full-width login CTA — maps to `Button` `variant="login"`.
 *
 * Sizing mirrors trade-harmonizer's `PrimaryButton` as the login page uses it:
 * `h-12 w-full rounded-lg px-4`, `text-xs sm:text-base` semibold, with the
 * disabled fill coming from the `login` variant (`rp-disabled` === their
 * `disableColor`).
 */
export const LoginButton = forwardRef<HTMLButtonElement, LoginButtonProps>(function LoginButton(
  { className, size, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="login"
      size={size ?? 'lg'}
      className={cn('w-full rounded-lg px-4 text-xs font-semibold sm:text-base', className)}
      {...props}
    />
  )
})
LoginButton.displayName = 'LoginButton'
