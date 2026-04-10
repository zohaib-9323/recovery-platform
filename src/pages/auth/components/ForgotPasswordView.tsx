import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

import { AppLogo } from '@/components/brand/app-logo'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { SuccessPopup } from '@/components/popup'
import { Card, CardContent } from '@/components/ui/card'

type ForgotPasswordViewProps = {
  email: string
  emailError?: string
  error: string | null
  canSubmit: boolean
  isLoading: boolean
  showSuccess: boolean
  successDescription: string
  onEmailChange: (value: string) => void
  onSubmit: () => Promise<unknown>
  onSuccessAction: () => Promise<unknown>
  onSuccessClose: () => void
}

export function ForgotPasswordView({
  email,
  emailError,
  error,
  canSubmit,
  isLoading,
  showSuccess,
  successDescription,
  onEmailChange,
  onSubmit,
  onSuccessAction,
  onSuccessClose,
}: ForgotPasswordViewProps) {
  return (
    <>
      <Card
        padding="none"
        className="box-border w-full max-w-[584px] rounded-[10px] border-0 bg-white p-5 shadow-[0_8px_24px_2px_rgba(0,0,0,0.059)]"
      >
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-col items-center gap-3 text-center">
            <AppLogo size="lg" />
            <h1 className="text-4xl font-bold leading-tight text-rp-heading">Forgot Password?</h1>
            <p className="max-w-[430px] text-base text-rp-description">
              Enter the email you used to create your account so we can send you a link for
              resetting your password.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void onSubmit()
            }}
            className="flex flex-col gap-4"
          >
            <InputField
              fieldType="email"
              id="forgot-email"
              name="forgot-email"
              label="Email Address"
              autoComplete="email"
              leftIcon={<Mail strokeWidth={2} />}
              placeholder="johndoe@email.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              error={emailError}
              aria-invalid={Boolean(emailError)}
            />

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <LoginButton type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
            </LoginButton>
          </form>

          <p className="text-sm text-rp-description">
            Go back to login?{' '}
            <Link to="/login" className="font-semibold text-rp-heading hover:underline">
              Login ↗
            </Link>
          </p>
        </CardContent>
      </Card>

      <SuccessPopup
        open={showSuccess}
        title="Check Your Email!"
        description={successDescription}
        actionLabel="Resend Email"
        onAction={() => {
          void onSuccessAction()
        }}
        onClose={onSuccessClose}
      />
    </>
  )
}
