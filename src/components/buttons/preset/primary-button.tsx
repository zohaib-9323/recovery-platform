import { forwardRef } from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'

export type PrimaryButtonProps = Omit<ButtonProps, 'variant'>

/** Solid accent (primary) action — maps to `Button` `variant="default"`. */
export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  function PrimaryButton(props, ref) {
    return <Button ref={ref} variant="default" {...props} />
  },
)
PrimaryButton.displayName = 'PrimaryButton'
