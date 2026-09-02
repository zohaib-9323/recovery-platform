import { Check } from 'lucide-react'

import { LoginButton } from '@/components/buttons'

type PasswordSuccessPopupProps = {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

/**
 * Checkmark success popup shared by reset-password and first-login setup —
 * mirrors trade-harmonizer's `ResetPasswordPopup` exactly (rounded-[22px]
 * card, lightGreen circle with a tick, single CTA, no close button).
 */
export function PasswordSuccessPopup({
  title,
  description,
  actionLabel,
  onAction,
}: PasswordSuccessPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex w-full items-center justify-center p-3">
        <div className="w-full rounded-[22px] bg-white p-3 sm:max-w-xl sm:p-5">
          <div className="flex flex-col items-center space-y-3 text-center sm:space-y-6">
            <div className="flex h-16 min-w-16 items-center justify-center rounded-full bg-lightGreen sm:h-20 sm:min-w-20 lg:h-28 lg:min-w-28">
              <Check className="h-8 w-8 text-greenOne lg:h-10 lg:w-10" strokeWidth={3} />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">{title}</h1>
              <p className="text-xs font-normal text-black sm:text-sm lg:text-base">
                {description}
              </p>
            </div>
          </div>
          <div className="mt-2 w-full">
            <LoginButton type="button" onClick={onAction}>
              {actionLabel}
            </LoginButton>
          </div>
        </div>
      </div>
    </div>
  )
}
