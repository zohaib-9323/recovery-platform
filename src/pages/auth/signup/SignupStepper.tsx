import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/useI18n'

export type SignupStep = 'personal-info' | 'email-verification'

const STEP_ORDER: SignupStep[] = ['personal-info', 'email-verification']

export type SignupStepperProps = {
  activeStep: SignupStep
  className?: string
}

/**
 * Two-step "Personal Information → Email Verification" header shown atop the
 * signup form and the signup OTP screen.
 *
 * Mirrors trade-harmonizer's `Registration` stepper
 * (`src/app/(auth)/(signup)/registration/page.tsx`) exactly rather than a
 * from-scratch reading of the Figma frame: bare icon-font glyphs (no
 * background chip), a small translated green tick badge on a completed
 * step, and a `border-2` connector line between steps — using the same
 * `icomoon` icon font (`icon-personal-info` / `icon-email-verify` /
 * `icon-tick`) already ported into this repo's `trade-harmonizer-icons.css`.
 */
export function SignupStepper({ activeStep, className }: SignupStepperProps) {
  const { t } = useI18n()
  const activeIndex = STEP_ORDER.indexOf(activeStep)

  const steps = [
    {
      key: 'personal-info' as const,
      label: t('auth.signup.stepper.personalInfo'),
      icon: 'icon-personal-info',
    },
    {
      key: 'email-verification' as const,
      label: t('auth.signup.stepper.emailVerification'),
      icon: 'icon-email-verify',
    },
  ]

  return (
    <div
      className={cn(
        'w-full rounded-[22px] bg-white px-3 py-3 shadow-[0px_4px_24px_0px_#f2f2f2] sm:px-5 sm:py-4 md:py-5',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === activeIndex
          const isCompleted = index < activeIndex

          return (
            <div key={step.key} className="relative flex flex-1 items-center">
              <div className="flex flex-1 cursor-default flex-col items-center gap-0 sm:gap-1 lg:gap-2">
                {isCompleted ? (
                  <div className="translate flex h-3 min-w-3 translate-x-4 translate-y-3 items-center justify-center rounded-full border border-white bg-lightGreen sm:h-4 sm:min-w-4 sm:translate-x-5 sm:translate-y-4 md:translate-y-5">
                    <span className="icon-tick text-[4px] text-green sm:text-[6px]" />
                  </div>
                ) : null}
                <span
                  className={cn(
                    step.icon,
                    'text-2xl sm:text-3xl lg:text-4xl',
                    isActive || isCompleted ? 'text-primary' : 'text-lightGrey',
                  )}
                />
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-tiny font-medium sm:text-xs lg:text-sm',
                      isActive || isCompleted ? 'text-black' : 'text-lightGrey',
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    'translate absolute end-0 w-2/4 flex-1 -translate-y-1 translate-x-6 border-2 sm:translate-x-16',
                    isCompleted ? 'border-primary' : 'border-lightGrey',
                  )}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
