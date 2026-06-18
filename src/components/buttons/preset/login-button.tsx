import { forwardRef } from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LoginButtonProps = Omit<ButtonProps, 'variant'>

/** Full-width login CTA — maps to `Button` `variant="login"`. */
export const LoginButton = forwardRef<HTMLButtonElement, LoginButtonProps>(function LoginButton(
  { className, size, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="login"
      size={size ?? 'lg'}
      className={cn('w-full', className)}
      {...props}
    />
  )
})
LoginButton.displayName = 'LoginButton'
