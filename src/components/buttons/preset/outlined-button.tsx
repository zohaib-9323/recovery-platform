import { forwardRef } from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'

export type OutlinedButtonProps = Omit<ButtonProps, 'variant'>

/** Border + transparent fill — maps to `Button` `variant="outline"`. */
export const OutlinedButton = forwardRef<HTMLButtonElement, OutlinedButtonProps>(
  function OutlinedButton(props, ref) {
    return <Button ref={ref} variant="outline" {...props} />
  },
)
OutlinedButton.displayName = 'OutlinedButton'
